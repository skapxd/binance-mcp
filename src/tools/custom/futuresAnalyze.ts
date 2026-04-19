// src/tools/custom/futuresAnalyze.ts
// Análisis completo de un símbolo de futuros en un solo llamado MCP.
// Indicadores: RSI 1h+15m (Wilder), MACD 1h, EMA 7/25/99, ATR 1h, volumen ratio.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usdsFuturesClient } from "../../config/binanceClient.js";
import { calcRSI, rsiZone, calcEMA, emaStructure, calcMACD, calcATR, atrSLSuggestion, volumeRatio, fmtVol } from "../../indicators/index.js";

export function registerBinanceFuturesAnalyze(server: McpServer) {
    server.tool(
        "BinanceCustomFuturesAnalyze",
        "Full market analysis for a futures symbol in one call: price, RSI 1h+15m (Wilder), MACD 1h, EMA 7/25/99, ATR, funding rate, 4h/15m candles, orderbook bid/ask ratio, volume ratio. Use this instead of multiple manual scripts for Pilar 2 opportunity analysis.",
        {
            symbol: z.string().describe("Trading pair, e.g. ORDIUSDT"),
        },
        async ({ symbol }) => {
            try {
                const api = (usdsFuturesClient.restAPI as any);

                const [tickerRes, premiumRes, fundingRes, k4hRes, k1hRes, k15mRes, obRes] = await Promise.all([
                    api.ticker24hrPriceChangeStatistics({ symbol }),
                    api.markPrice({ symbol }),
                    api.getFundingRateHistory({ symbol, limit: 4 }),
                    api.klineCandlestickData({ symbol, interval: "4h", limit: 8 }),
                    api.klineCandlestickData({ symbol, interval: "1h", limit: 100 }),
                    api.klineCandlestickData({ symbol, interval: "15m", limit: 100 }),
                    api.orderBook({ symbol, limit: 10 }),
                ]);

                const bigIntReplacer = (_: string, v: any) => typeof v === "bigint" ? v.toString() : v;
                const ticker = JSON.parse(JSON.stringify(await tickerRes.data(), bigIntReplacer));
                const premium = JSON.parse(JSON.stringify(await premiumRes.data(), bigIntReplacer));
                const funding = JSON.parse(JSON.stringify(await fundingRes.data(), bigIntReplacer));
                const k4h = JSON.parse(JSON.stringify(await k4hRes.data(), bigIntReplacer));
                const k1h = JSON.parse(JSON.stringify(await k1hRes.data(), bigIntReplacer));
                const k15m = JSON.parse(JSON.stringify(await k15mRes.data(), bigIntReplacer));
                const ob = JSON.parse(JSON.stringify(await obRes.data(), bigIntReplacer));

                // --- Closes y OHLC ---
                const closes1h  = k1h.map((k: any) => parseFloat(k[4]));
                const closes15m = k15m.map((k: any) => parseFloat(k[4]));
                const ohlc1h    = k1h.map((k: any) => [parseFloat(k[1]), parseFloat(k[2]), parseFloat(k[3]), parseFloat(k[4])]);

                // --- RSI ---
                const rsi1h  = calcRSI(closes1h);
                const rsi15m = calcRSI(closes15m);

                // --- MACD 1h ---
                const macd = calcMACD(closes1h);

                // --- EMAs 1h ---
                const ema7  = calcEMA(closes1h, 7);
                const ema25 = calcEMA(closes1h, 25);
                const ema99 = calcEMA(closes1h, 99);
                const price = parseFloat(ticker.lastPrice);
                const emaTrend = emaStructure(price, ema7, ema25, ema99);

                // --- ATR 1h ---
                const atr = calcATR(ohlc1h);

                // --- Funding ---
                const lastFr = parseFloat(premium.lastFundingRate) * 100;
                const frStatus = lastFr > 0.05 ? "✅" : lastFr < -0.05 ? "❌" : "⚠️";
                const frInterpretation = lastFr > 0.05
                    ? "Longs pagando — sobreextensión alcista. Apto para short."
                    : lastFr < -0.05
                    ? "Shorts pagando — riesgo de squeeze. NO shortear."
                    : "Neutro — analizar resto de señales.";
                const frHist = (Array.isArray(funding) ? funding : [funding])
                    .map((f: any) => (parseFloat(f.fundingRate) * 100).toFixed(4) + "%")
                    .join(" → ");

                // --- Price metrics ---
                const high24 = parseFloat(ticker.highPrice);
                const low24  = parseFloat(ticker.lowPrice);
                const pumpPct  = ((high24 - low24) / low24 * 100).toFixed(1);
                const distPico = ((high24 - price) / high24 * 100).toFixed(1);

                // --- Orderbook ---
                const bids = ob.bids.reduce((s: number, b: any) => s + parseFloat(b[1]), 0);
                const asks = ob.asks.reduce((s: number, a: any) => s + parseFloat(a[1]), 0);
                const obRatio = (bids / asks).toFixed(2);

                // --- Volume 4h trend ---
                const vols4h = k4h.map((k: any) => parseFloat(k[5]));
                const peakVol4h = Math.max(...vols4h.slice(0, -1));
                const lastVol4h = vols4h[vols4h.length - 1];
                const volDrop = ((peakVol4h - lastVol4h) / peakVol4h * 100).toFixed(0);

                // --- Volume 15m ratio (últimas 7 velas: 6 prev + 1 actual) ---
                const vols15m = k15m.slice(-7).map((k: any) => parseFloat(k[5]));
                const volRatio15m = volumeRatio(vols15m);

                // --- Candles display ---
                const fmtCandle = (k: any) => {
                    const o = parseFloat(k[1]), c = parseFloat(k[4]), v = parseFloat(k[5]);
                    return `${c > o ? "🟢" : "🔴"}(${((c - o) / o * 100).toFixed(1)}%) v:${fmtVol(v)}`;
                };
                const candles4h  = k4h.slice(-5).map(fmtCandle).join("  ");
                const candles15m = k15m.slice(-6).map(fmtCandle).join("  ");

                const report = [
                    `=== ${symbol} ===`,
                    `Precio: $${price} | 24h: ${ticker.priceChangePercent}%`,
                    `Pico 24h: $${high24} | Low: $${low24}`,
                    `Pump desde mínimos: +${pumpPct}% | Dist desde pico: -${distPico}%`,
                    ``,
                    `── MOMENTUM ──`,
                    `RSI 1h:  ${rsi1h.toFixed(1)}  ${rsiZone(rsi1h)}`,
                    `RSI 15m: ${rsi15m.toFixed(1)}  ${rsiZone(rsi15m)}`,
                    `MACD 1h: ${macd.macd.toFixed(2)} | Signal: ${macd.signal.toFixed(2)} | Hist: ${macd.histogram.toFixed(2)}`,
                    `         ${macd.trend}`,
                    ``,
                    `── ESTRUCTURA ──`,
                    `EMA  7: $${ema7.toFixed(2)}  EMA 25: $${ema25.toFixed(2)}  EMA 99: $${ema99.toFixed(2)}`,
                    `Tendencia: ${emaTrend}`,
                    `ATR 1h: $${atr.toFixed(2)} | ${atrSLSuggestion(price, atr, price > ema99 ? "LONG" : "SHORT")}`,
                    ``,
                    `── FUNDING ──`,
                    `Funding: ${frStatus} ${lastFr.toFixed(4)}% → ${frInterpretation}`,
                    `Historial (4 períodos): ${frHist}`,
                    ``,
                    `── MERCADO ──`,
                    `Orderbook bid/ask: ${obRatio} (>1 más compradores, <1 más vendedores)`,
                    `Vol 4h vs pico: -${volDrop}% ${parseInt(volDrop) >= 50 ? "✅ Agotamiento" : "⚠️ Volumen aún alto"}`,
                    `Vol 15m actual vs avg: ${volRatio15m.ratio.toFixed(2)}x — ${volRatio15m.label}`,
                    ``,
                    `── VELAS ──`,
                    `4h  (últimas 5): ${candles4h}`,
                    `15m (últimas 6): ${candles15m}`,
                ].join("\n");

                return { content: [{ type: "text", text: report }] };

            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return { content: [{ type: "text", text: `❌ Analysis failed: ${msg}` }], isError: true };
            }
        }
    );
}
