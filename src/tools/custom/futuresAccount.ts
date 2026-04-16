// src/tools/custom/futuresAccount.ts
// Estado de la cuenta de futuros en un llamado: balance, posiciones abiertas, órdenes abiertas.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { usdsFuturesClient } from "../../config/binanceClient.js";

export function registerBinanceFuturesAccount(server: McpServer) {
    server.tool(
        "BinanceCustomFuturesAccount",
        "Returns current futures account status in one call: available USDT balance, all open positions (symbol, size, entry price, mark price, unrealized PnL, ROI%, margin, liquidation price), and all open orders. Use this at the start of each session or before placing new trades.",
        {},
        async () => {
            try {
                const api = (usdsFuturesClient.restAPI as any);

                const [balanceRes, positionsRes, ordersRes] = await Promise.all([
                    api.futuresAccountBalanceV2(),
                    api.positionInformationV2(),
                    api.currentAllOpenOrders(),
                ]);

                const bigIntReplacer = (_: string, v: any) => typeof v === "bigint" ? v.toString() : v;
                const balances = JSON.parse(JSON.stringify(await balanceRes.data(), bigIntReplacer));
                const positions = JSON.parse(JSON.stringify(await positionsRes.data(), bigIntReplacer));
                const orders = JSON.parse(JSON.stringify(await ordersRes.data(), bigIntReplacer));

                // Balance USDT
                const usdt = balances.find((b: any) => b.asset === "USDT");
                const available = usdt ? parseFloat(usdt.availableBalance).toFixed(2) : "N/A";
                const total = usdt ? parseFloat(usdt.balance).toFixed(2) : "N/A";
                const unrealized = usdt ? parseFloat(usdt.crossUnPnl).toFixed(2) : "N/A";

                // Open positions (non-zero)
                const openPos = positions.filter((p: any) => parseFloat(p.positionAmt) !== 0);
                const posLines = openPos.length === 0
                    ? "  (ninguna)"
                    : openPos.map((p: any) => {
                        const size = parseFloat(p.positionAmt);
                        const entry = parseFloat(p.entryPrice);
                        const mark = parseFloat(p.markPrice);
                        const pnl = parseFloat(p.unrealizedProfit);
                        const roi = entry > 0 ? ((mark - entry) / entry * 100 * (size < 0 ? -1 : 1)).toFixed(2) : "0";
                        const dir = size < 0 ? "SHORT" : "LONG";
                        return `  ${p.symbol} ${dir} ${Math.abs(size)} | Entrada: $${entry} | Mark: $${mark} | PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USDT (${roi}%) | Liq: $${parseFloat(p.liquidationPrice).toFixed(4)}`;
                    }).join("\n");

                // Open orders
                const orderLines = orders.length === 0
                    ? "  (ninguna)"
                    : orders.map((o: any) =>
                        `  ${o.symbol} ${o.side} ${o.positionSide} ${o.type} $${o.price} qty:${o.origQty} | orderId:${o.orderId}`
                    ).join("\n");

                const report = [
                    `=== CUENTA FUTUROS ===`,
                    `Balance USDT: $${total} total | $${available} disponible | PnL abierto: ${parseFloat(unrealized) >= 0 ? "+" : ""}${unrealized} USDT`,
                    ``,
                    `POSICIONES ABIERTAS (${openPos.length}):`,
                    posLines,
                    ``,
                    `ÓRDENES ABIERTAS (${orders.length}):`,
                    orderLines,
                ].join("\n");

                return { content: [{ type: "text", text: report }] };

            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return { content: [{ type: "text", text: `❌ Account query failed: ${msg}` }], isError: true };
            }
        }
    );
}
