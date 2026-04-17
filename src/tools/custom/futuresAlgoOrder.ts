// src/tools/custom/futuresAlgoOrder.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import crypto from "crypto";

const FAPI = "https://fapi.binance.com";

function sign(qs: string): string {
    return crypto.createHmac("sha256", process.env.BINANCE_API_SECRET ?? "").update(qs).digest("hex");
}

async function signedRequest(method: string, path: string, params: Record<string, string | number | boolean>) {
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) filtered[k] = String(v);
    }
    filtered.recvWindow = "5000";
    filtered.timestamp = Date.now().toString();

    const qs = new URLSearchParams(filtered).toString();
    const signature = sign(qs);
    const url = `${FAPI}${path}?${qs}&signature=${signature}`;

    const res = await fetch(url, {
        method,
        headers: { "X-MBX-APIKEY": process.env.BINANCE_API_KEY ?? "" },
    });
    const data = await res.json();
    if (!Array.isArray(data) && data?.code && data.code < 0) {
        throw new Error(`${data.msg} (${data.code})`);
    }
    return data;
}

export function registerBinanceFuturesAlgoOrder(server: McpServer) {
    // Place algo order (TP, SL, trailing stop)
    server.tool(
        "BinanceCustomFuturesAlgoOrder",
        "Place a conditional order (Take Profit, Stop Loss, Trailing Stop) on Binance USDⓈ-M Futures via the Algo Order API. Use this instead of regular order endpoint for STOP_MARKET, TAKE_PROFIT_MARKET, STOP, TAKE_PROFIT, TRAILING_STOP_MARKET. ⚠️ Real money.",
        {
            symbol: z.string().describe("Trading pair, e.g. ETHUSDT"),
            side: z.enum(["BUY", "SELL"]).describe("Order direction. SELL to close a LONG, BUY to close a SHORT."),
            type: z.enum(["STOP_MARKET", "TAKE_PROFIT_MARKET", "STOP", "TAKE_PROFIT", "TRAILING_STOP_MARKET"]).describe("Conditional order type"),
            triggerPrice: z.number().positive().describe("Price at which the order triggers"),
            quantity: z.number().positive().optional().describe("Quantity. Omit if using closePosition."),
            closePosition: z.boolean().optional().describe("If true, closes the entire position when triggered. Cannot use with quantity."),
            price: z.number().positive().optional().describe("Limit price (only for STOP and TAKE_PROFIT, not MARKET variants)"),
            positionSide: z.enum(["LONG", "SHORT", "BOTH"]).optional().describe("Required in Hedge Mode. Default BOTH for One-way Mode."),
            workingType: z.enum(["MARK_PRICE", "CONTRACT_PRICE"]).optional().describe("Trigger based on mark or contract price. Default CONTRACT_PRICE."),
        },
        async ({ symbol, side, type, triggerPrice, quantity, closePosition, price, positionSide, workingType }) => {
            try {
                const params: Record<string, string | number | boolean> = {
                    algoType: "CONDITIONAL",
                    symbol, side, type, triggerPrice,
                };
                if (quantity !== undefined) params.quantity = quantity;
                if (closePosition) params.closePosition = "true";
                if (price !== undefined) params.price = price;
                if (positionSide) params.positionSide = positionSide;
                if (workingType) params.workingType = workingType;

                const data = await signedRequest("POST", "/fapi/v1/algoOrder", params);
                return {
                    content: [{
                        type: "text",
                        text: `✅ Algo order placed\n  Type: ${data.orderType}\n  Side: ${data.side}\n  Trigger: $${data.triggerPrice}\n  Status: ${data.algoStatus}\n  AlgoId: ${data.algoId}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `❌ Algo order failed: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true
                };
            }
        }
    );

    // Query open algo orders
    server.tool(
        "BinanceCustomFuturesAlgoOpenOrders",
        "Get all open conditional orders (TP, SL, trailing stop) for a symbol on Binance USDⓈ-M Futures.",
        {
            symbol: z.string().optional().describe("Trading pair. If omitted, returns all symbols."),
        },
        async ({ symbol }) => {
            try {
                const params: Record<string, string | number | boolean> = {};
                if (symbol) params.symbol = symbol;

                const data = await signedRequest("GET", "/fapi/v1/openAlgoOrders", params);
                const orders = Array.isArray(data) ? data : [];

                if (orders.length === 0) {
                    return { content: [{ type: "text", text: "No open algo orders." }] };
                }

                const lines = orders.map((o: any) =>
                    `  ${o.orderType} ${o.side} | trigger: $${o.triggerPrice} | status: ${o.algoStatus} | algoId: ${o.algoId}`
                );
                return {
                    content: [{ type: "text", text: `Open algo orders (${orders.length}):\n${lines.join("\n")}` }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `❌ Failed: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true
                };
            }
        }
    );

    // Cancel algo order
    server.tool(
        "BinanceCustomFuturesCancelAlgoOrder",
        "Cancel a specific conditional order (TP, SL, trailing stop) by its algoId.",
        {
            symbol: z.string().describe("Trading pair, e.g. ETHUSDT"),
            algoId: z.number().describe("The algoId of the order to cancel. Get it from BinanceCustomFuturesAlgoOpenOrders."),
        },
        async ({ symbol, algoId }) => {
            try {
                const data = await signedRequest("DELETE", "/fapi/v1/algoOrder", { symbol, algoId });
                return {
                    content: [{ type: "text", text: `✅ Algo order cancelled\n  AlgoId: ${data.algoId}\n  Status: ${data.msg ?? "success"}` }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `❌ Cancel failed: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true
                };
            }
        }
    );
}
