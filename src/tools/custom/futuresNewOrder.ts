// src/tools/custom/futuresNewOrder.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { usdsFuturesClient } from "../../config/binanceClient.js";

export function registerBinanceFuturesNewOrder(server: McpServer) {
    server.tool(
        "BinanceCustomFuturesNewOrder",
        "Place a new order on Binance USDⓈ-M Futures (BTCUSDT, ETHUSDT, etc.). Supports MARKET and LIMIT orders with optional leverage and margin-type setup. ⚠️ Real money. Always double-check parameters before calling.",
        {
            symbol: z.string().describe("Trading pair, e.g. BTCUSDT"),
            side: z.enum(["BUY", "SELL"]).describe("Order direction"),
            type: z.enum(["MARKET", "LIMIT", "STOP", "STOP_MARKET", "TAKE_PROFIT", "TAKE_PROFIT_MARKET"]).describe("Order type"),
            quantity: z.number().positive().describe("Base-asset quantity (e.g. 0.001 BTC). If you only know USDT amount, compute qty = usdt / price first."),
            price: z.number().positive().optional().describe("Price (required for LIMIT)"),
            timeInForce: z.enum(["GTC", "IOC", "FOK", "GTX"]).optional().describe("Default GTC for LIMIT. GTX = post-only (maker)."),
            reduceOnly: z.boolean().optional().describe("True = only reduce existing position (no new entries)"),
            leverage: z.number().min(1).max(125).optional().describe("If provided, sets leverage for the symbol before placing the order"),
            marginType: z.enum(["ISOLATED", "CROSSED"]).optional().describe("If provided, sets margin type before placing the order. Fails silently if already set."),
            newClientOrderId: z.string().optional().describe("Your own tracking id")
        },
        async ({ symbol, side, type, quantity, price, timeInForce, reduceOnly, leverage, marginType, newClientOrderId }) => {
            try {
                const notes: string[] = [];

                if (marginType) {
                    try {
                        await (usdsFuturesClient.restAPI as any).changeMarginType({ symbol, marginType });
                        notes.push(`marginType set to ${marginType}`);
                    } catch (e: any) {
                        // Error code -4046 = "No need to change margin type" (already set)
                        const msg = e?.message ?? String(e);
                        if (msg.includes("-4046") || msg.toLowerCase().includes("no need to change")) {
                            notes.push(`marginType already ${marginType}`);
                        } else {
                            notes.push(`marginType change warning: ${msg}`);
                        }
                    }
                }

                if (leverage !== undefined) {
                    try {
                        await (usdsFuturesClient.restAPI as any).changeInitialLeverage({ symbol, leverage });
                        notes.push(`leverage set to ${leverage}x`);
                    } catch (e: any) {
                        notes.push(`leverage change warning: ${e?.message ?? String(e)}`);
                    }
                }

                const params: any = { symbol, side, type, quantity };
                if (price !== undefined) params.price = price;
                if (timeInForce !== undefined) params.timeInForce = timeInForce;
                else if (type === "LIMIT") params.timeInForce = "GTC";
                if (reduceOnly !== undefined) params.reduceOnly = reduceOnly ? "true" : "false";
                if (newClientOrderId) params.newClientOrderId = newClientOrderId;

                const response = await (usdsFuturesClient.restAPI as any).newOrder(params);
                const data = await response.data();

                const bigIntReplacer = (_: string, v: any) => typeof v === "bigint" ? v.toString() : v;
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Futures order placed.\nPre-order steps:\n${notes.map(n => `  - ${n}`).join("\n") || "  (none)"}\n\nOrder response:\n${JSON.stringify(data, bigIntReplacer, 2)}`
                        }
                    ]
                };
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: "text", text: `❌ Futures order failed: ${msg}` }],
                    isError: true
                };
            }
        }
    );
}
