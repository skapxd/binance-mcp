// src/tools/custom/gridCandidateAnalyzer.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ATR, BollingerBands } from "trading-signals";
import * as ss from "simple-statistics";
import { spotClient } from "../../config/binanceClient.js";

type Bar = { openTime: number; open: number; high: number; low: number; close: number; volume: number; quoteVolume: number };

const STABLECOINS = new Set([
    "USDC", "DAI", "FDUSD", "TUSD", "BUSD", "USDP", "USDE", "USDS", "USDG", "USDZ", "USDK", "USDN",
    "USD1", "USD2", "RLUSD", "PYUSD", "GUSD", "LUSD", "FRAX", "U", "UUSD",
    "EUR", "EURS", "AEUR", "GBP", "TRY", "BRL", "TRYB"
]);
const STABLE_PATTERN = /^([A-Z]*USD[A-Z0-9]?|USD[0-9A-Z]+|U|EURS?|AEUR|GBP|TRY|BRL|TRYB)$/;

function parseKlines(raw: any[]): Bar[] {
    return raw.map(k => ({
        openTime: Number(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        quoteVolume: parseFloat(k[7])
    }));
}

async function fetchKlines(symbol: string, interval: string, limit: number): Promise<Bar[]> {
    const res = await spotClient.restAPI.klines({ symbol, interval: interval as any, limit });
    const data = await res.data();
    return parseKlines(data as any[]);
}

async function fetchKlinesRange(symbol: string, interval: string, startMs: number, endMs: number): Promise<Bar[]> {
    const all: Bar[] = [];
    let cursor = startMs;
    while (cursor < endMs) {
        const res = await spotClient.restAPI.klines({ symbol, interval: interval as any, startTime: cursor, endTime: endMs, limit: 1000 });
        const data = await res.data();
        const bars = parseKlines(data as any[]);
        if (bars.length === 0) break;
        all.push(...bars);
        const lastOpen = bars[bars.length - 1].openTime;
        cursor = lastOpen + 60_000; // 1m step; safe for 1m interval
        if (bars.length < 1000) break;
    }
    return all;
}

async function fetchTicker24hrAll(): Promise<any[]> {
    // SDK enforces symbol param; the public REST endpoint does not. Use direct fetch
    // to the public api.binance.com endpoint (no auth, no credentials leaked).
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    if (!res.ok) throw new Error(`ticker24hr HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [data];
}

async function fetchSpread(symbol: string): Promise<number> {
    const res = await spotClient.restAPI.depth({ symbol, limit: 5 });
    const data: any = await res.data();
    const bid = parseFloat(data.bids?.[0]?.[0] ?? "0");
    const ask = parseFloat(data.asks?.[0]?.[0] ?? "0");
    if (!bid || !ask) return 0;
    return (ask - bid) / ((ask + bid) / 2);
}

function computeATR(bars: Bar[], period = 14): number {
    const atr = new ATR(period);
    let last: any = null;
    for (const b of bars) last = atr.update({ high: b.high, low: b.low, close: b.close } as any, false);
    return typeof last === "number" ? last : last ? Number(last) : NaN;
}

function computeBBWidth(bars: Bar[], period = 20): number {
    const bb = new BollingerBands(period, 2);
    let last: any = null;
    for (const b of bars) last = bb.update(b.close, false);
    if (!last) return NaN;
    return (Number(last.upper) - Number(last.lower)) / Number(last.middle);
}

function kaufmanER(bars: Bar[], period = 20): number {
    const n = Math.min(period, bars.length - 1);
    if (n < 2) return 0;
    const slice = bars.slice(-n - 1);
    const change = Math.abs(slice[slice.length - 1].close - slice[0].close);
    let volatility = 0;
    for (let i = 1; i < slice.length; i++) volatility += Math.abs(slice[i].close - slice[i - 1].close);
    return volatility === 0 ? 0 : change / volatility;
}

function meanCrossings(bars: Bar[]): number {
    const closes = bars.map(b => b.close);
    const mean = ss.mean(closes);
    let crossings = 0;
    for (let i = 1; i < closes.length; i++) {
        if ((closes[i - 1] - mean) * (closes[i] - mean) < 0) crossings++;
    }
    return crossings;
}

function regressionSlopePctPerDay(bars: Bar[]): number {
    const points: [number, number][] = bars.map((b, i) => [i, b.close]);
    const { m, b: intercept } = ss.linearRegression(points);
    const firstClose = intercept;
    if (firstClose === 0) return 0;
    return (m / firstClose) * 100;
}

function dailyReturns(bars: Bar[]): number[] {
    const r: number[] = [];
    for (let i = 1; i < bars.length; i++) r.push((bars[i].close - bars[i - 1].close) / bars[i - 1].close);
    return r;
}

function score(metrics: {
    quoteVolume24h: number;
    spreadPct: number;
    atrPct: number;
    kaufmanER: number;
    slopePctPerDay: number;
    btcCorrelation: number;
}): { total: number; breakdown: Record<string, number> } {
    const liquidity = Math.min(25, (Math.log10(Math.max(metrics.quoteVolume24h, 1)) - 6) * 5);
    const liqPenalty = metrics.spreadPct > 0.001 ? -5 : 0;
    const liqScore = Math.max(0, Math.min(25, liquidity + liqPenalty));

    const atrSweet = metrics.atrPct >= 2 && metrics.atrPct <= 6 ? 20 : Math.max(0, 20 - Math.abs(4 - metrics.atrPct) * 4);
    const rangeScore = Math.max(0, 25 - metrics.kaufmanER * 50);
    const trendWeakness = Math.max(0, 15 - Math.abs(metrics.slopePctPerDay) * 5);
    const decoupling = Math.max(0, 15 - Math.abs(metrics.btcCorrelation) * 15);

    const total = liqScore + atrSweet + rangeScore + trendWeakness + decoupling;
    return {
        total: Math.round(total),
        breakdown: {
            liquidity: Math.round(liqScore),
            volatility: Math.round(atrSweet),
            rangeBehavior: Math.round(rangeScore),
            trendWeakness: Math.round(trendWeakness),
            btcDecoupling: Math.round(decoupling)
        }
    };
}

function verdict(total: number): string {
    if (total >= 80) return "EXCELLENT";
    if (total >= 65) return "GOOD";
    if (total >= 50) return "MARGINAL";
    return "AVOID";
}

async function analyzeSymbol(
    symbol: string,
    lookbackDays: number,
    btcReturns: number[] | null,
    capitalUsdt?: number,
    maxLeverage = 3,
    takerFeePct = 0.04,
    backtestDays = 0,
    gridNumOverride?: number,
    backtestWindowDays = 0
) {
    const [bars, ticker24h, spreadPct] = await Promise.all([
        fetchKlines(symbol, "1d", lookbackDays + 5),
        (async () => {
            const res = await spotClient.restAPI.ticker24hr({ symbol });
            return await res.data();
        })(),
        fetchSpread(symbol)
    ]);

    if (bars.length < 20) throw new Error(`Not enough history for ${symbol}`);

    const closes = bars.map(b => b.close);
    const returns = dailyReturns(bars);
    const atrAbs = computeATR(bars, 14);
    const lastClose = closes[closes.length - 1];
    const atrPct = (atrAbs / lastClose) * 100;
    const bbWidth = computeBBWidth(bars, 20) * 100;
    const er = kaufmanER(bars, 20);
    const crossings = meanCrossings(bars.slice(-lookbackDays));
    const slope = regressionSlopePctPerDay(bars.slice(-lookbackDays));
    const p10 = ss.quantile(closes.slice(-lookbackDays), 0.1);
    const p90 = ss.quantile(closes.slice(-lookbackDays), 0.9);
    const positionInRange = (lastClose - Math.min(...closes.slice(-lookbackDays))) / (Math.max(...closes.slice(-lookbackDays)) - Math.min(...closes.slice(-lookbackDays)));

    let corr = 0;
    if (symbol !== "BTCUSDT" && btcReturns && btcReturns.length === returns.length) {
        corr = ss.sampleCorrelation(returns, btcReturns);
    }

    const quoteVolume24h = parseFloat((ticker24h as any).quoteVolume ?? "0");

    const metrics = {
        quoteVolume24h,
        spreadPct,
        atrPct,
        kaufmanER: er,
        slopePctPerDay: slope,
        btcCorrelation: corr
    };
    const { total, breakdown } = score(metrics);

    const flags: string[] = [];
    if (quoteVolume24h < 10_000_000) flags.push("LOW_LIQUIDITY");
    if (spreadPct > 0.001) flags.push("WIDE_SPREAD");
    if (atrPct < 1.5) flags.push("LOW_VOLATILITY");
    if (atrPct > 8) flags.push("EXTREME_VOLATILITY");
    if (Math.abs(slope) > 1) flags.push("TRENDING");
    if (er > 0.4) flags.push("DIRECTIONAL_MOVE");
    if (Math.abs(corr) > 0.85) flags.push("HIGH_BTC_CORRELATION");
    if (positionInRange < 0.1 || positionInRange > 0.9) flags.push("PRICE_AT_RANGE_EXTREME");

    const plan = buildOptimalGridPlan({
        symbol,
        price: lastClose,
        atrPct,
        bbWidthPct: bbWidth,
        slopePctPerDay: slope,
        meanCrossings: crossings,
        lookbackDays,
        capital: capitalUsdt,
        maxLeverage,
        takerFeePct,
        gridNumOverride
    });

    const histLowObs = Math.min(...closes.slice(-lookbackDays));
    const histHighObs = Math.max(...closes.slice(-lookbackDays));

    let backtest: BacktestResult | undefined;
    if (backtestDays > 0) {
        const endMs = Date.now();
        const startMs = endMs - backtestDays * 86400 * 1000;
        const minuteBars = await fetchKlinesRange(symbol, "1m", startMs, endMs);
        if (minuteBars.length > 60) {
            backtest = backtestGrid(minuteBars, {
                lowerPrice: plan.lowerPrice,
                upperPrice: plan.upperPrice,
                gridNum: plan.gridNum,
                mode: plan.mode,
                leverage: plan.leverage,
                profitPerGridPct: plan.profitPerGridPct,
                roundTripFeePct: plan.roundTripFeePct
            }, plan.initialMarginUsdt ?? capitalUsdt ?? 500, backtestWindowDays);
        }
    }

    return {
        symbol,
        score: total,
        verdict: verdict(total),
        breakdown,
        metrics: {
            price: lastClose,
            quoteVolume24hUsdt: quoteVolume24h,
            spreadPct: spreadPct * 100,
            atrPct,
            bbWidthPct: bbWidth,
            kaufmanER: er,
            meanCrossings30d: crossings,
            slopePctPerDay: slope,
            btcCorrelation: corr,
            positionInRange
        },
        flags,
        optimalGridPlan: plan,
        backtest,
        historicalRange: {
            p10,
            p90,
            lowObs: histLowObs,
            highObs: histHighObs
        }
    };
}

interface PlanInput {
    symbol: string;
    price: number;
    atrPct: number;
    bbWidthPct: number;
    slopePctPerDay: number;
    meanCrossings: number;
    lookbackDays: number;
    capital?: number;
    maxLeverage: number;
    takerFeePct: number;
    gridNumOverride?: number;
}

function buildOptimalGridPlan(i: PlanInput) {
    // 1. Direction
    let strategyType: "GRID_NEUTRAL" | "GRID_LONG" | "GRID_SHORT" = "GRID_NEUTRAL";
    if (i.slopePctPerDay > 0.3) strategyType = "GRID_LONG";
    else if (i.slopePctPerDay < -0.3) strategyType = "GRID_SHORT";

    // 2. Range centered on current price, half-width from ATR
    const halfWidthPct = Math.max(0.08, Math.min(0.25, (i.atrPct / 100) * 5));
    const lowerPrice = i.price * (1 - halfWidthPct);
    const upperPrice = i.price * (1 + halfWidthPct);

    // 3. Grid count — user override or proportional to BB width (20..80)
    const gridNum = i.gridNumOverride ?? Math.max(20, Math.min(80, Math.round(i.bbWidthPct * 10)));
    const mode: "ARITHMETIC" | "GEOMETRIC" = i.bbWidthPct > 30 ? "GEOMETRIC" : "ARITHMETIC";

    // 4. Leverage — conservative. Goal: ATR × leverage stays in a safe band
    //    Rule of thumb: leverage × ATR% ≤ 12, capped by user maxLeverage.
    const rawLeverage = Math.floor(12 / Math.max(i.atrPct, 1.5));
    const leverage = Math.max(1, Math.min(i.maxLeverage, rawLeverage));

    // 5. Stop-loss: 2% safety buffer below the lower range (see guide)
    const stopLossPrice = lowerPrice * 0.98;
    const stopLossDistancePct = ((i.price - stopLossPrice) / i.price) * 100;

    // 6. Take-profit (optional): mirror above upper
    const takeProfitPrice = upperPrice * 1.02;

    // 7. Profit per grid (raw and net)
    let profitPerGridPct: number;
    if (mode === "GEOMETRIC") {
        profitPerGridPct = (Math.pow(upperPrice / lowerPrice, 1 / gridNum) - 1) * 100;
    } else {
        profitPerGridPct = ((upperPrice - lowerPrice) / gridNum / i.price) * 100;
    }
    const roundTripFeePct = i.takerFeePct * 2;
    const profitPerGridNetPct = profitPerGridPct - roundTripFeePct;

    // 8. Estimated daily fills — rough: oscillation/day ~= ATR, grid spacing ~= range/gridNum
    const gridSpacingPct = ((upperPrice - lowerPrice) / gridNum / i.price) * 100;
    const estimatedDailyFills = gridSpacingPct > 0 ? Math.round(i.atrPct / gridSpacingPct) : 0;

    // 9. Break-even fills & monthly projection
    const feesBreakEvenFills = profitPerGridPct > 0 ? Math.ceil(roundTripFeePct / profitPerGridPct) : Infinity;
    const estimatedMonthlyReturnPct = estimatedDailyFills * profitPerGridNetPct * 30;

    // 10. Position sizing (if capital provided)
    let initialMarginUsdt: number | undefined;
    let notionalUsdt: number | undefined;
    let perGridNotionalUsdt: number | undefined;
    let minExchangeNotionalWarning = false;
    if (i.capital !== undefined) {
        initialMarginUsdt = Math.max(20, i.capital);
        notionalUsdt = initialMarginUsdt * leverage;
        perGridNotionalUsdt = notionalUsdt / gridNum;
        // Binance futures typical min notional per order ~5 USDT; warn if below 5
        if (perGridNotionalUsdt < 5) minExchangeNotionalWarning = true;
    }

    // 11. Liquidation buffer estimate (rough, assumes isolated 1-cross margin ≈ 1/leverage move)
    //     Liquidation distance ≈ 100/leverage − maintenance (~0.5%) %
    const liquidationDistancePct = Math.max(0, 100 / leverage - 0.5);
    const liquidationBufferPct = liquidationDistancePct - stopLossDistancePct;

    // 12. Warnings
    const warnings: string[] = [];
    if (profitPerGridNetPct <= 0) warnings.push(`profit/grid (${profitPerGridPct.toFixed(3)}%) is below round-trip fee (${roundTripFeePct.toFixed(3)}%) — will lose money on every fill`);
    if (profitPerGridNetPct > 0 && profitPerGridNetPct < 0.03) warnings.push("profit margin per grid is very thin (<0.03% net)");
    if (liquidationBufferPct < 5) warnings.push(`liquidation price sits only ${liquidationBufferPct.toFixed(1)}% below stop-loss — reduce leverage`);
    if (estimatedDailyFills < 2) warnings.push("very few fills expected per day — monthly return may be near zero");
    if (i.atrPct > 8) warnings.push("asset is extremely volatile — grid may break out of range quickly");
    if (i.meanCrossings < 4) warnings.push(`only ${i.meanCrossings} mean-crossings in ${i.lookbackDays}d — weak oscillation pattern`);
    if (minExchangeNotionalWarning) warnings.push("per-grid notional < 5 USDT — Binance may reject orders; reduce gridNum or increase capital");

    // Corrected monthly projection: % of CAPITAL, not summed per-slot percentages
    const estimatedMonthlyReturnOnCapitalPct = (estimatedDailyFills * (profitPerGridNetPct / 100) * leverage * 30) / gridNum * 100;

    return {
        strategyType,
        marginMode: "ISOLATED" as const,
        lowerPrice,
        upperPrice,
        halfWidthPct: halfWidthPct * 100,
        gridNum,
        mode,
        leverage,
        stopLossPrice,
        stopLossDistancePct,
        takeProfitPrice,
        profitPerGridPct,
        profitPerGridNetPct,
        roundTripFeePct,
        feesBreakEvenFills,
        estimatedDailyFills,
        estimatedMonthlyReturnPct: estimatedMonthlyReturnOnCapitalPct,
        liquidationDistancePct,
        liquidationBufferPct,
        initialMarginUsdt,
        notionalUsdt,
        perGridNotionalUsdt,
        warnings
    };
}

interface BacktestResult {
    days: number;
    barsAnalyzed: number;
    crossings: number;
    fillsPerDay: number;
    gridSpacing: number;
    // Returns on capital (not notional)
    grossProfitUsdt: number;
    feesUsdt: number;
    netProfitUsdt: number;
    netReturnPctOnCapital: number;
    projectedMonthlyReturnPctOnCapital: number;
    outOfRangePct: number; // % of bars where price exited [lower, upper]
    windows?: BacktestWindow[];
}

interface BacktestWindow {
    index: number;
    days: number;
    startDate: string;
    endDate: string;
    priceStart: number;
    priceEnd: number;
    priceMin: number;
    priceMax: number;
    crossings: number;
    fillsPerDay: number;
    netProfitUsdt: number;
    netReturnPctOnCapital: number;
    cumulativeNetReturnPct: number;
    outOfRangePct: number;
    status: "HEALTHY" | "DEGRADED" | "BROKEN";
}

function simulateBars(bars: Bar[], gridLines: number[], perGridNotional: number, profitPerGridPct: number, roundTripFeePct: number, lowerPrice: number, upperPrice: number) {
    let crossings = 0;
    let outOfRange = 0;
    let priceMin = bars[0].low;
    let priceMax = bars[0].high;
    let prevMid = (bars[0].open + bars[0].close) / 2;

    for (let i = 1; i < bars.length; i++) {
        const bar = bars[i];
        const currMid = (bar.open + bar.close) / 2;

        if (bar.low < priceMin) priceMin = bar.low;
        if (bar.high > priceMax) priceMax = bar.high;
        if (bar.high < lowerPrice || bar.low > upperPrice) outOfRange++;

        const lo = Math.min(prevMid, currMid);
        const hi = Math.max(prevMid, currMid);
        for (const line of gridLines) {
            if (line > lo && line <= hi) crossings++;
        }
        prevMid = currMid;
    }

    const halfProfitPct = profitPerGridPct / 2;
    const halfFeePct = roundTripFeePct / 2;
    const grossProfitUsdt = crossings * (halfProfitPct / 100) * perGridNotional;
    const feesUsdt = crossings * (halfFeePct / 100) * perGridNotional;
    const netProfitUsdt = grossProfitUsdt - feesUsdt;

    return { crossings, outOfRange, priceMin, priceMax, grossProfitUsdt, feesUsdt, netProfitUsdt };
}

function buildGridLines(lowerPrice: number, upperPrice: number, gridNum: number, mode: "ARITHMETIC" | "GEOMETRIC"): number[] {
    const lines: number[] = [];
    if (mode === "GEOMETRIC") {
        const ratio = Math.pow(upperPrice / lowerPrice, 1 / gridNum);
        for (let k = 0; k <= gridNum; k++) lines.push(lowerPrice * Math.pow(ratio, k));
    } else {
        const step = (upperPrice - lowerPrice) / gridNum;
        for (let k = 0; k <= gridNum; k++) lines.push(lowerPrice + k * step);
    }
    return lines;
}

function backtestGrid(bars: Bar[], plan: {
    lowerPrice: number;
    upperPrice: number;
    gridNum: number;
    mode: "ARITHMETIC" | "GEOMETRIC";
    leverage: number;
    profitPerGridPct: number;
    roundTripFeePct: number;
}, capital: number, windowDays = 0): BacktestResult {
    const { lowerPrice, upperPrice, gridNum, mode, leverage, profitPerGridPct, roundTripFeePct } = plan;
    const gridLines = buildGridLines(lowerPrice, upperPrice, gridNum, mode);
    const notional = capital * leverage;
    const perGridNotional = notional / gridNum;

    const sim = simulateBars(bars, gridLines, perGridNotional, profitPerGridPct, roundTripFeePct, lowerPrice, upperPrice);
    const days = bars.length / 1440;
    const netReturnPctOnCapital = (sim.netProfitUsdt / capital) * 100;

    let windows: BacktestWindow[] | undefined;
    if (windowDays > 0 && days > windowDays) {
        windows = [];
        const barsPerWindow = windowDays * 1440;
        let cumulative = 0;
        for (let start = 0, idx = 0; start < bars.length; start += barsPerWindow, idx++) {
            const slice = bars.slice(start, Math.min(start + barsPerWindow, bars.length));
            if (slice.length < 60) break;
            const ws = simulateBars(slice, gridLines, perGridNotional, profitPerGridPct, roundTripFeePct, lowerPrice, upperPrice);
            const wDays = slice.length / 1440;
            const wReturn = (ws.netProfitUsdt / capital) * 100;
            cumulative += wReturn;
            const oorPct = (ws.outOfRange / slice.length) * 100;
            let status: "HEALTHY" | "DEGRADED" | "BROKEN" = "HEALTHY";
            if (oorPct > 50) status = "BROKEN";
            else if (oorPct > 15 || wReturn < 0) status = "DEGRADED";
            windows.push({
                index: idx,
                days: Math.round(wDays * 10) / 10,
                startDate: new Date(slice[0].openTime).toISOString().slice(0, 10),
                endDate: new Date(slice[slice.length - 1].openTime).toISOString().slice(0, 10),
                priceStart: slice[0].open,
                priceEnd: slice[slice.length - 1].close,
                priceMin: Math.round(ws.priceMin * 1e8) / 1e8,
                priceMax: Math.round(ws.priceMax * 1e8) / 1e8,
                crossings: ws.crossings,
                fillsPerDay: Math.round((ws.crossings / Math.max(wDays, 1)) * 10) / 10,
                netProfitUsdt: Math.round(ws.netProfitUsdt * 100) / 100,
                netReturnPctOnCapital: Math.round(wReturn * 100) / 100,
                cumulativeNetReturnPct: Math.round(cumulative * 100) / 100,
                outOfRangePct: Math.round(oorPct * 100) / 100,
                status
            });
        }
    }

    return {
        days: Math.round(days * 10) / 10,
        barsAnalyzed: bars.length,
        crossings: sim.crossings,
        fillsPerDay: Math.round((sim.crossings / Math.max(days, 1)) * 10) / 10,
        gridSpacing: (upperPrice - lowerPrice) / gridNum,
        grossProfitUsdt: Math.round(sim.grossProfitUsdt * 100) / 100,
        feesUsdt: Math.round(sim.feesUsdt * 100) / 100,
        netProfitUsdt: Math.round(sim.netProfitUsdt * 100) / 100,
        netReturnPctOnCapital: Math.round(netReturnPctOnCapital * 100) / 100,
        projectedMonthlyReturnPctOnCapital: Math.round(netReturnPctOnCapital * (30 / Math.max(days, 1)) * 100) / 100,
        outOfRangePct: Math.round((sim.outOfRange / bars.length) * 10000) / 100,
        windows
    };
}

export function registerBinanceGridCandidateAnalyzer(server: McpServer) {
    server.tool(
        "BinanceCustomGridCandidateAnalyzer",
        "Analyze one coin (or scan top N) to evaluate its suitability as a grid-bot candidate. Computes liquidity, volatility, range-behavior, trend, and BTC-correlation metrics to produce a 0-100 score and a suggested grid configuration. Screening only — not financial advice.",
        {
            symbol: z.string().optional().describe("e.g. BNBUSDT. If omitted, scans top N symbols."),
            top: z.number().min(1).max(100).optional().default(10).describe("Number of symbols to scan when symbol is omitted"),
            rankBy: z.enum(["volume", "trades", "priceChangeAbs", "price_asc", "price_desc"]).optional().default("volume").describe("Ranking criterion for scan mode"),
            minVolume: z.number().optional().default(10_000_000).describe("Minimum 24h quote volume USDT to include in scan"),
            quoteAsset: z.string().optional().default("USDT").describe("Only consider pairs ending in this quote asset"),
            lookbackDays: z.number().min(14).max(180).optional().default(30).describe("Days of history for metrics"),
            capitalUsdt: z.number().optional().describe("Capital in USDT you plan to deploy on this grid. Enables position sizing in the plan."),
            maxLeverage: z.number().min(1).max(20).optional().default(3).describe("Maximum leverage you're willing to use. Tool will pick a safe value ≤ this."),
            takerFeePct: z.number().optional().default(0.04).describe("Your Binance futures taker fee %. VIP0=0.04, maker grids may use 0.02. Used to compute profit-per-grid net of fees."),
            daysToBacktest: z.number().min(0).max(365).optional().default(7).describe("Days of 1m-klines to run the backtest against the proposed grid. Default 7 for fast scans; use 30, 90, 150 or up to 365 for deeper history. 0 disables the backtest entirely. Longer ranges take more API calls."),
            gridNumOverride: z.number().min(2).max(500).optional().describe("Override the auto-calculated number of grid rows. Useful to sweep values (e.g. 10, 20, 50, 100, 200, 500) and find the sweet spot."),
            backtestWindowDays: z.number().min(0).max(30).optional().default(0).describe("If >0, splits the backtest into windows of this size (e.g. 7 = weekly) and reports per-window P&L so you can see how grid health evolves over time. 0 = single aggregate result.")
        },
        async ({ symbol, top, rankBy, minVolume, quoteAsset, lookbackDays, capitalUsdt, maxLeverage, takerFeePct, daysToBacktest, gridNumOverride, backtestWindowDays }) => {
            try {
                const btcBars = await fetchKlines("BTCUSDT", "1d", lookbackDays + 5);
                const btcReturns = dailyReturns(btcBars);

                if (symbol) {
                    const result = await analyzeSymbol(symbol, lookbackDays, btcReturns, capitalUsdt, maxLeverage, takerFeePct, daysToBacktest, gridNumOverride, backtestWindowDays);
                    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
                }

                const all = await fetchTicker24hrAll();
                const candidates = all.filter((t: any) => {
                    if (!t.symbol.endsWith(quoteAsset)) return false;
                    const base = t.symbol.slice(0, -quoteAsset.length);
                    if (STABLECOINS.has(base)) return false;
                    if (STABLE_PATTERN.test(base)) return false;
                    if (parseFloat(t.quoteVolume) < minVolume) return false;
                    if (/UP|DOWN|BEAR|BULL/i.test(base)) return false;
                    if (/[^\x00-\x7F]/.test(t.symbol)) return false;
                    return true;
                });

                const sorted = candidates.sort((a: any, b: any) => {
                    switch (rankBy) {
                        case "trades": return parseInt(b.count) - parseInt(a.count);
                        case "priceChangeAbs": return Math.abs(parseFloat(b.priceChangePercent)) - Math.abs(parseFloat(a.priceChangePercent));
                        case "price_asc": return parseFloat(a.lastPrice) - parseFloat(b.lastPrice);
                        case "price_desc": return parseFloat(b.lastPrice) - parseFloat(a.lastPrice);
                        default: return parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
                    }
                }).slice(0, top);

                const results = await Promise.allSettled(
                    sorted.map((t: any) => analyzeSymbol(t.symbol, lookbackDays, btcReturns, capitalUsdt, maxLeverage, takerFeePct, daysToBacktest, gridNumOverride, backtestWindowDays))
                );

                const ok = results
                    .filter(r => r.status === "fulfilled")
                    .map(r => (r as PromiseFulfilledResult<any>).value)
                    .sort((a, b) => b.score - a.score);
                const errors = results
                    .map((r, i) => r.status === "rejected" ? { symbol: sorted[i].symbol, error: String((r as PromiseRejectedResult).reason) } : null)
                    .filter(Boolean);

                const summary = ok.map(r =>
                    `  ${r.verdict.padEnd(10)} ${r.score.toString().padStart(3)}/100  ${r.symbol.padEnd(14)} vol=$${(r.metrics.quoteVolume24hUsdt / 1e6).toFixed(1)}M  atr=${r.metrics.atrPct.toFixed(2)}%  er=${r.metrics.kaufmanER.toFixed(2)}  slope=${r.metrics.slopePctPerDay.toFixed(2)}%/d  corrBTC=${r.metrics.btcCorrelation.toFixed(2)}  flags=[${r.flags.join(",")}]`
                ).join("\n");

                const text = [
                    `Grid Candidate Scan — rankBy=${rankBy}, analyzed ${ok.length}/${sorted.length}`,
                    ``,
                    `Ranking (best candidate first):`,
                    summary,
                    errors.length ? `\nErrors:\n${errors.map(e => `  ${e!.symbol}: ${e!.error}`).join("\n")}` : "",
                    ``,
                    `Top 3 detail:\n${JSON.stringify(ok.slice(0, 3), null, 2)}`
                ].join("\n");

                return { content: [{ type: "text", text }] };
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return { content: [{ type: "text", text: `Analyzer failed: ${msg}` }], isError: true };
            }
        }
    );
}
