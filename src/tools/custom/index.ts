// src/tools/custom/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBinanceTotalEstimatedValue } from "./totalEstimatedValue.js";
import { registerBinanceGridCandidateAnalyzer } from "./gridCandidateAnalyzer.js";
import { registerBinanceFuturesNewOrder } from "./futuresNewOrder.js";
import { registerBinanceFuturesAnalyze } from "./futuresAnalyze.js";
import { registerBinanceFuturesAccount } from "./futuresAccount.js";
import { registerBinanceFuturesBotStatus } from "./futuresBotStatus.js";
import { registerBinanceFuturesAlgoOrder } from "./futuresAlgoOrder.js";

export function registerBinanceCustomTools(server: McpServer) {
    registerBinanceTotalEstimatedValue(server);
    registerBinanceGridCandidateAnalyzer(server);
    registerBinanceFuturesNewOrder(server);
    registerBinanceFuturesAlgoOrder(server);
    registerBinanceFuturesAnalyze(server);
    registerBinanceFuturesAccount(server);
    registerBinanceFuturesBotStatus(server);
}
