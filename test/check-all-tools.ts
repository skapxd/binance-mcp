// test/check-all-tools.ts
import { spawn } from "child_process";
import { resolve } from "path";

const serverPath = resolve("src/index.ts");
console.log("🚀 Iniciando servidor MCP...");
const startTime = Date.now();

const child = spawn("npx", ["tsx", serverPath], {
    stdio: ["pipe", "pipe", "inherit"],
    env: { ...process.env, MINIMAL_MODE: "false" }
});

let output = "";
let firstChunkReceived = false;

child.stdout.on("data", (chunk) => {
    if (!firstChunkReceived) {
        console.log(`⏱️  Primer chunk recibido en: ${Date.now() - startTime}ms`);
        firstChunkReceived = true;
    }
    output += chunk.toString();
    try {
        const response = JSON.parse(output);
        const endTime = Date.now();
        console.log(`✅ JSON completo parseado en: ${endTime - startTime}ms`);
        
        if (response.result && response.result.tools) {
            console.log(`📦 Total herramientas: ${response.result.tools.length}`);
        }
        
        child.kill();
        process.exit(0);
    } catch (e) {
        // Acumulando...
    }
});

const listToolsRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
};

child.stdin.write(JSON.stringify(listToolsRequest) + "\n");

setTimeout(() => {
    console.log(`❌ Timeout después de ${Date.now() - startTime}ms`);
    child.kill();
    process.exit(1);
}, 30000);
