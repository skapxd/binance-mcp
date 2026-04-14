import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createServer } from "../src/index.js";

describe("Binance MCP Programmatic Tests (Supertest style)", () => {
    
    async function setupTest() {
        const server = createServer();
        
        // Creamos dos transportes conectados entre sí
        let serverTransport: InMemoryTransport;
        let clientTransport: InMemoryTransport;
        
        serverTransport = new InMemoryTransport();
        clientTransport = new InMemoryTransport();
        
        // Establecemos el vínculo manual (el SDK de MCP requiere que los mensajes fluyan de uno a otro)
        serverTransport.onmessage = (msg) => clientTransport.handleMessage(msg);
        clientTransport.onmessage = (msg) => serverTransport.handleMessage(msg);

        const client = new Client({
            name: "test-client",
            version: "1.0.0"
        }, {
            capabilities: {}
        });

        // Conectamos ambos
        await server.connect(serverTransport);
        await client.connect(clientTransport);
        
        return { client, server };
    }

    it("debe listar todas las herramientas (161) programáticamente", async () => {
        process.env.MINIMAL_MODE = "false";
        const { client } = await setupTest();
        
        const response = await client.listTools();
        
        expect(response.tools).toHaveLength(161);
    });

    it("debe ejecutar BinanceDiagnostic correctamente", async () => {
        process.env.BINANCE_API_KEY = "";
        const { client } = await setupTest();
        
        const result = await client.callTool({
            name: "BinanceDiagnostic",
            arguments: {}
        });

        // @ts-ignore
        expect(result.content[0].text).toContain("Binance");
    });
});
