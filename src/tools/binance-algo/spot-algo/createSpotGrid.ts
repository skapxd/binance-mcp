// src/tools/binance-algo/spot-algo/createSpotGrid.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { algoClient } from "../../../config/binanceClient.js";

export function registerBinanceCreateSpotGrid(server: McpServer) {
    server.tool(
        "BinanceCreateSpotGrid",
        "Create a native Binance Spot Grid Trading strategy. This runs on Binance servers.",
        {
            symbol: z.string().describe("Symbol to trade (e.g., BTCUSDT)"),
            lowerPrice: z.number().describe("Lower price of the grid"),
            upperPrice: z.number().describe("Upper price of the grid"),
            gridNum: z.number().min(2).max(200).describe("Number of grids (2-200)"),
            totalQuoteAmount: z.number().describe("Total investment amount in quote asset (e.g., USDT)"),
            gridMode: z.enum(["ARITHMETIC", "GEOMETRIC"]).optional().default("ARITHMETIC").describe("Grid calculation mode"),
        },
        async ({ symbol, lowerPrice, upperPrice, gridNum, totalQuoteAmount, gridMode }) => {
            try {
                // Endpoint para crear una orden de Grid en Spot
                const response = await (algoClient as any).restAPI.newOrderGrid({
                    symbol,
                    lowerPrice,
                    upperPrice,
                    gridNum,
                    totalQuoteAmount,
                    gridMode
                });

                const data = await response.data();

                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ ¡Estrategia de Spot Grid creada con éxito en Binance!\nDetalles de la orden: ${JSON.stringify(data)}`
                        }
                    ]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        { type: "text", text: `Error al crear el Grid: ${errorMessage}` }
                    ],
                    isError: true
                };
            }
        }
    );
}
