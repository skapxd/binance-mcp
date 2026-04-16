// src/tools/custom/futuresBotStatus.ts
// Estado de un bot grid de Pilar 1: precio actual, % en rango, distancia al stop y al techo, funding.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usdsFuturesClient } from "../../config/binanceClient.js";

export function registerBinanceFuturesBotStatus(server: McpServer) {
    server.tool(
        "BinanceCustomFuturesBotStatus",
        "Check the current status of a Pilar 1 grid bot: current price, position within the grid range (%), distance to stop loss and to upper limit, current funding rate. Use this for daily bot check-ins.",
        {
            symbol: z.string().describe("Trading pair, e.g. SOLUSDT"),
            rangeMin: z.number().describe("Grid lower bound price"),
            rangeMax: z.number().describe("Grid upper bound price"),
            stopLoss: z.number().describe("Stop loss price"),
        },
        async ({ symbol, rangeMin, rangeMax, stopLoss }) => {
            try {
                const api = (usdsFuturesClient.restAPI as any);

                const [tickerRes, premiumRes, fundingRes] = await Promise.all([
                    api.ticker24hrPriceChangeStatistics({ symbol }),
                    api.markPrice({ symbol }),
                    api.getFundingRateHistory({ symbol, limit: 3 }),
                ]);

                const bigIntReplacer = (_: string, v: any) => typeof v === "bigint" ? v.toString() : v;
                const ticker = JSON.parse(JSON.stringify(await tickerRes.data(), bigIntReplacer));
                const premium = JSON.parse(JSON.stringify(await premiumRes.data(), bigIntReplacer));
                const funding = JSON.parse(JSON.stringify(await fundingRes.data(), bigIntReplacer));

                const price = parseFloat(ticker.lastPrice);
                const posInRange = ((price - rangeMin) / (rangeMax - rangeMin) * 100).toFixed(1);
                const distStop = ((price - stopLoss) / stopLoss * 100).toFixed(1);
                const distTecho = ((rangeMax - price) / rangeMax * 100).toFixed(1);
                const distSuelo = ((price - rangeMin) / rangeMin * 100).toFixed(1);
                const change24h = parseFloat(ticker.priceChangePercent).toFixed(2);

                const lastFr = parseFloat(premium.lastFundingRate) * 100;
                const frStatus = lastFr > 0.05 ? "✅" : lastFr < -0.05 ? "⚠️ Funding negativo — monitorear" : "✅ Neutro";
                const frHist = (Array.isArray(funding) ? funding : [funding])
                    .map((f: any) => (parseFloat(f.fundingRate) * 100).toFixed(4) + "%")
                    .join(" → ");

                // Alertas
                const alerts: string[] = [];
                if (parseFloat(distStop) < 15) alerts.push(`🔴 ALERTA: precio a ${distStop}% del stop — considerar cerrar el bot`);
                if (parseFloat(distTecho) < 10) alerts.push(`🔴 ALERTA: precio a ${distTecho}% del techo — posible salida del rango`);
                if (parseFloat(distSuelo) < 10) alerts.push(`⚠️ Precio cerca del piso del rango (${distSuelo}% sobre límite inferior)`);
                if (lastFr < -0.05) alerts.push(`⚠️ Funding negativo (${lastFr.toFixed(3)}%) — vigilar el bot`);
                if (price < rangeMin) alerts.push(`🔴 PRECIO FUERA DEL RANGO (por debajo del piso $${rangeMin})`);
                if (price > rangeMax) alerts.push(`🔴 PRECIO FUERA DEL RANGO (por encima del techo $${rangeMax})`);

                const posZone = parseFloat(posInRange) < 30 ? "zona baja ⚠️"
                    : parseFloat(posInRange) > 70 ? "zona alta ⚠️"
                    : "zona media ✅";

                const report = [
                    `=== ${symbol} — Bot Grid ===`,
                    `Precio actual: $${price} | 24h: ${change24h}%`,
                    `Rango: $${rangeMin} – $${rangeMax} | Stop: $${stopLoss}`,
                    ``,
                    `Posición en rango: ${posInRange}% (${posZone})`,
                    `Distancia al stop:  +${distStop}%`,
                    `Distancia al techo: -${distTecho}%`,
                    `Distancia al piso:  +${distSuelo}%`,
                    ``,
                    `Funding: ${frStatus} ${lastFr.toFixed(4)}% | Historial: ${frHist}`,
                    alerts.length > 0 ? `\n⚠️ ALERTAS:\n${alerts.map(a => "  " + a).join("\n")}` : `\n✅ Sin alertas — bot operando normalmente`,
                ].join("\n");

                return { content: [{ type: "text", text: report }] };

            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return { content: [{ type: "text", text: `❌ Bot status failed: ${msg}` }], isError: true };
            }
        }
    );
}
