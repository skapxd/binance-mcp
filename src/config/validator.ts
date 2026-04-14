// src/config/validator.ts
export interface ConfigStatus {
    isValid: boolean;
    missing: string[];
    details: { [key: string]: boolean };
}

export function getBinanceConfigStatus(): ConfigStatus {
    const required = ["BINANCE_API_KEY", "BINANCE_API_SECRET"];
    const status: { [key: string]: boolean } = {};
    const missing: string[] = [];

    required.forEach(variable => {
        const val = process.env[variable];
        const isPresent = !!val && val.trim().length > 0;
        status[variable] = isPresent;
        if (!isPresent) missing.push(variable);
    });

    return {
        isValid: missing.length === 0,
        missing,
        details: status
    };
}

export function ensureConfig() {
    const status = getBinanceConfigStatus();
    if (!status.isValid) {
        throw new Error(`Configuración incompleta de Binance. Faltan las siguientes variables de entorno: ${status.missing.join(", ")}. Por favor, configúralas en tu cliente MCP.`);
    }
}
