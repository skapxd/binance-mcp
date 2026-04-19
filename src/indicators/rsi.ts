// Wilder Smoothed RSI — mismo método que Binance UI
// Validado contra fapi.binance.com/fapi/v1/klines con cálculo manual

export function calcRSI(closes: number[], period = 14): number {
    if (closes.length < period + 1) return NaN;

    const changes = closes.slice(1).map((c, i) => c - closes[i]);

    let avgGain = changes.slice(0, period).filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    let avgLoss = changes.slice(0, period).filter(c => c < 0).map(c => Math.abs(c)).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < changes.length; i++) {
        avgGain = (avgGain * (period - 1) + Math.max(changes[i], 0)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.max(-changes[i], 0)) / period;
    }

    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + avgGain / avgLoss));
}

export function rsiZone(rsi: number): string {
    if (rsi >= 70) return "🔴 Sobrecompra";
    if (rsi <= 30) return "🟢 Sobreventa";
    if (rsi >= 55) return "⚠️ Alcista";
    if (rsi <= 45) return "⚠️ Bajista";
    return "➡️ Neutro";
}
