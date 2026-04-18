// src/tools/custom/futuresAnalyze.ts
// Análisis completo de un símbolo de futuros en un solo llamado MCP.
// Reemplaza los scripts node de análisis manual (precio, RSI, funding, velas, orderbook).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usdsFuturesClient } from "../../config/binanceClient.js";

export function registerBinanceFuturesAnalyze(server: McpServer) {
    server.tool(
        "BinanceCustomFuturesAnalyze",
        "Full market analysis for a futures symbol in one call: price, RSI 1h, funding rate (last + 4-period history), 4h/15m candles, orderbook bid/ask ratio, pump % from 24h low, distance from 24h high. Use this instead of multiple manual scripts for Pilar 2 opportunity analysis.",
        {
            symbol: z.string().describe("Trading pair, e.g. ORDIUSDT"),
        },
        async ({ symbol }) => {
            try {
                const api = (usdsFuturesClient.restAPI as any);

                // Fetch all data in parallel
                const [tickerRes, premiumRes, fundingRes, k4hRes, k1hRes, k15mRes, obRes] = await Promise.all([
                    api.ticker24hrPriceChangeStatistics({ symbol }),
                    api.markPrice({ symbol }),
                    api.getFundingRateHistory({ symbol, limit: 4 }),
                    api.klineCandlestickData({ symbol, interval: "4h", limit: 8 }),
                    api.klineCandlestickData({ symbol, interval: "1h", limit: 14 }),
                    api.klineCandlestickData({ symbol, interval: "15m", limit: 6 }),
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

                // RSI 1h (14-period simple)
                const closes1h = k1h.map((k: any) => parseFloat(k[4]));
                let gains = 0, losses = 0;
                for (let i = 1; i < closes1h.length; i++) {
                    const d = closes1h[i] - closes1h[i - 1];
                    if (d > 0) gains += d; else losses -= d;
                }
                const period = closes1h.length - 1;
                const avgG = gains / period, avgL = losses / period;
                const rsi = avgL === 0 ? 100 : 100 - (100 / (1 + avgG / avgL));

                // Funding
                const lastFr = parseFloat(premium.lastFundingRate) * 100;
                const frStatus = lastFr > 0.05 ? "✅" : lastFr < -0.05 ? "❌" : "⚠️";
                const frHist = (Array.isArray(funding) ? funding : [funding])
                    .map((f: any) => (parseFloat(f.fundingRate) * 100).toFixed(4) + "%")
                    .join(" → ");

                // Price metrics
                const price = parseFloat(ticker.lastPrice);
                const high24 = parseFloat(ticker.highPrice);
                const low24 = parseFloat(ticker.lowPrice);
                const pumpPct = ((high24 - low24) / low24 * 100).toFixed(1);
                const distPico = ((high24 - price) / high24 * 100).toFixed(1);

                // Orderbook
                const bids = ob.bids.reduce((s: number, b: any) => s + parseFloat(b[1]), 0);
                const asks = ob.asks.reduce((s: number, a: any) => s + parseFloat(a[1]), 0);
                const obRatio = (bids / asks).toFixed(2);

                // Volume trend 4h (base asset volume = coins, matches Binance UI)
                const vols4h = k4h.map((k: any) => parseFloat(k[5]));
                const peakVol4h = Math.max(...vols4h.slice(0, -1));
                const lastVol4h = vols4h[vols4h.length - 1];
                const volDrop = ((peakVol4h - lastVol4h) / peakVol4h * 100).toFixed(0);

                const fmtVol = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v.toFixed(0);

                // 4h candles (last 5)
                const candles4h = k4h.slice(-5).map((k: any) => {
                    const o = parseFloat(k[1]), c = parseFloat(k[4]), v = parseFloat(k[5]);
                    return `${c > o ? "🟢" : "🔴"}(${((c - o) / o * 100).toFixed(1)}%) v:${fmtVol(v)}`;
                }).join("  ");

                // 15m candles (last 6)
                const candles15m = k15m.map((k: any) => {
                    const o = parseFloat(k[1]), c = parseFloat(k[4]), v = parseFloat(k[5]);
                    return `${c > o ? "🟢" : "🔴"}(${((c - o) / o * 100).toFixed(1)}%) v:${fmtVol(v)}`;
                }).join("  ");

                // Funding semaphore interpretation
                const frInterpretation = lastFr > 0.05
                    ? "Longs pagando — sobreextensión alcista. Apto para short."
                    : lastFr < -0.05
                    ? "Shorts pagando — riesgo de squeeze. NO shortear."
                    : "Neutro — analizar resto de señales.";

                const report = [
                    `=== ${symbol} ===`,
                    `Precio: $${price} | 24h: ${ticker.priceChangePercent}%`,
                    `Pico 24h: $${high24} | Low: $${low24}`,
                    `Pump desde mínimos: +${pumpPct}% | Dist desde pico: -${distPico}%`,
                    ``,
                    `RSI 1h: ${rsi.toFixed(1)}`,
                    `Funding: ${frStatus} ${lastFr.toFixed(4)}% → ${frInterpretation}`,
                    `Historial funding (4 períodos): ${frHist}`,
                    ``,
                    `Orderbook bid/ask: ${obRatio} (>1 más compradores, <1 más vendedores)`,
                    `Vol pico 4h vs actual: -${volDrop}% ${parseInt(volDrop) >= 50 ? "✅ Agotamiento" : "⚠️ Volumen aún alto"}`,
                    ``,
                    `Velas 4h (últimas 5): ${candles4h}`,
                    `Velas 15m (últimas 6): ${candles15m}`,
                ].join("\n");

                return { content: [{ type: "text", text: report }] };

            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return { content: [{ type: "text", text: `❌ Analysis failed: ${msg}` }], isError: true };
            }
        }
    );
}
