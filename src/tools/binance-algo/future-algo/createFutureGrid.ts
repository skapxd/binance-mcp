// src/tools/binance-algo/future-algo/createFutureGrid.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { algoClient } from "../../../config/binanceClient.js";

export function registerBinanceCreateFutureGrid(server: McpServer) {
    server.tool(
        "BinanceCreateFutureGrid",
        "Create a native Binance Futures Grid Trading strategy (Long, Short, or Neutral) with leverage.",
        {
            symbol: z.string().describe("Symbol to trade (e.g., BTCUSDT)"),
            strategyType: z.enum(["GRID_LONG", "GRID_SHORT", "GRID_NEUTRAL"]).describe("Strategy direction"),
            lowerPrice: z.number().describe("Lower price of the grid"),
            upperPrice: z.number().describe("Upper price of the grid"),
            gridNum: z.number().min(2).max(170).describe("Number of grids (2-170)"),
            initialMargin: z.number().describe("Initial margin/investment amount"),
            leverage: z.number().min(1).optional().default(1).describe("Leverage for the grid (e.g., 5 for 5x)"),
            gridMode: z.enum(["ARITHMETIC", "GEOMETRIC"]).optional().default("ARITHMETIC").describe("Grid calculation mode"),
        },
        async ({ symbol, strategyType, lowerPrice, upperPrice, gridNum, initialMargin, leverage, gridMode }) => {
            try {
                // Endpoint para crear una orden de Grid en Futuros
                // Nota: El SDK de Binance puede requerir parámetros específicos según la versión
                const response = await (algoClient as any).restAPI.newOrderGridFuture({
                    symbol,
                    strategyType,
                    lowerPrice,
                    upperPrice,
                    gridNum,
                    initialMargin,
                    leverage,
                    gridMode
                });

                const data = await response.data();

                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ ¡Estrategia de Futures Grid creada con éxito!\nDirección: ${strategyType}\nApalancamiento: ${leverage}x\nDetalles: ${JSON.stringify(data)}`
                        }
                    ]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        { type: "text", text: `Error al crear el Grid de Futuros: ${errorMessage}` }
                    ],
                    isError: true
                };
            }
        }
    );
}
