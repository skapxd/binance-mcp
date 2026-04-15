// src/tools/custom/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBinanceTotalEstimatedValue } from "./totalEstimatedValue.js";
import { registerBinanceGridCandidateAnalyzer } from "./gridCandidateAnalyzer.js";
import { registerBinanceFuturesNewOrder } from "./futuresNewOrder.js";

export function registerBinanceCustomTools(server: McpServer) {
    registerBinanceTotalEstimatedValue(server);
    registerBinanceGridCandidateAnalyzer(server);
    registerBinanceFuturesNewOrder(server);
}
