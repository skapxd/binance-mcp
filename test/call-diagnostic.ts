// test/call-diagnostic.ts
import { spawn } from "child_process";
import { resolve } from "path";

const serverPath = resolve("src/index.ts");
const child = spawn("npx", ["tsx", serverPath], {
    stdio: ["pipe", "pipe", "inherit"],
    env: { 
        ...process.env, 
        MINIMAL_MODE: "true",
        BINANCE_API_KEY: "", // Forzamos error
        BINANCE_API_SECRET: "" 
    }
});

let output = "";

child.stdout.on("data", (chunk) => {
    output += chunk.toString();
    try {
        const response = JSON.parse(output);
        console.log("\n--- Resultado de la Herramienta BinanceDiagnostic ---");
        console.log(response.result.content[0].text);
        child.kill();
        process.exit(0);
    } catch (e) {}
});

const callToolRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
        name: "BinanceDiagnostic",
        arguments: {}
    }
};

child.stdin.write(JSON.stringify(callToolRequest) + "\n");

setTimeout(() => {
    child.kill();
    process.exit(1);
}, 5000);
