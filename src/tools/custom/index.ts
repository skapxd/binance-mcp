// src/tools/custom/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBinanceTotalEstimatedValue } from "./totalEstimatedValue.js";

export function registerBinanceCustomTools(server: McpServer) {
    registerBinanceTotalEstimatedValue(server);
}
