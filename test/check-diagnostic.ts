// test/check-diagnostic.ts
import { spawn } from "child_process";
import { resolve } from "path";

const serverPath = resolve("src/index.ts");
const child = spawn("npx", ["tsx", serverPath], {
    stdio: ["pipe", "pipe", "inherit"],
    env: { ...process.env, MINIMAL_MODE: "true" } // Activamos modo minimalista
});

let output = "";

child.stdout.on("data", (chunk) => {
    output += chunk.toString();
    try {
        // Intentamos parsear cada vez que llega un chunk por si es un JSON completo
        const response = JSON.parse(output);
        console.log("\n--- Respuesta del Servidor MCP ---");
        
        if (response.result && response.result.tools) {
            console.log(`✅ Registro exitoso. Herramientas encontradas: ${response.result.tools.length}`);
            response.result.tools.forEach((t: any) => console.log(` - [TOOL] ${t.name}`));
        } else {
            console.log("Respuesta recibida:", JSON.stringify(response, null, 2));
        }
        
        child.kill();
        process.exit(0);
    } catch (e) {
        // Si no es un JSON completo aún, seguimos acumulando
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
    if (output) {
        console.log("JSON Incompleto recibido (posible error de parseo):", output.substring(0, 100) + "...");
    } else {
        console.log("Timeout esperando respuesta del servidor.");
    }
    child.kill();
    process.exit(1);
}, 5000);
