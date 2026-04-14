import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spotClient } from "../config/binanceClient.js";

export function registerBinanceOrderBook(server: McpServer) {
  server.tool(
    "BinanceMarketOrderBook",
    "Get the order book (depth) for a specific trading pair.",
    {
      symbol: z.string().describe("The trading pair (e.g., BTCUSDT)"),
      limit: z.number().optional().default(100).describe("Order book depth (max 5000)"),
    },
    async ({ symbol, limit }) => {
      try {
        const response = await spotClient.restAPI.depth({ symbol, limit });
        const data = await response.data();

        return {
          content: [
            {
              type: "text",
              text: `Order Book for ${symbol}:\n${JSON.stringify(data)}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error fetching order book: ${errorMessage}` }],
          isError: true,
        };
      }
    }
  );
}
