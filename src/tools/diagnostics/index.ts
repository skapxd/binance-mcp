// src/tools/diagnostics/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getBinanceConfigStatus } from "../../config/validator.js";

export function registerBinanceDiagnosticTools(server: McpServer) {
    server.tool(
        "BinanceCustomDiagnostic",
        "Checks the configuration status of the Binance MCP server and reports missing environment variables.",
        {},
        async () => {
            const status = getBinanceConfigStatus();
            
            let message = status.isValid 
                ? "✅ El servidor MCP de Binance está configurado correctamente y listo para operar."
                : `❌ El servidor MCP de Binance tiene una configuración incompleta.\nFaltan las siguientes variables: ${status.missing.join(", ")}.`;

            return {
                content: [
                    {
                        type: "text",
                        text: `${message}\n\nDetalles de configuración:\n${JSON.stringify(status.details, null, 2)}`
                    }
                ],
                isError: !status.isValid
            };
        }
    );
}
