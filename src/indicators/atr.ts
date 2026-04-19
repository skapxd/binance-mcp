// ATR — Average True Range (Wilder, 14 períodos)
// Usado para sizing de SL dinámico

export function calcATR(klines: number[][], period = 14): number {
    // klines: [[open, high, low, close], ...]
    const trValues: number[] = [];
    for (let i = 1; i < klines.length; i++) {
        const [, high, low] = klines[i];
        const prevClose = klines[i - 1][3];
        const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        trValues.push(tr);
    }
    if (trValues.length < period) return NaN;

    let atr = trValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < trValues.length; i++) {
        atr = (atr * (period - 1) + trValues[i]) / period;
    }
    return atr;
}

export function atrSLSuggestion(price: number, atr: number, direction: "LONG" | "SHORT", multiplier = 2): string {
    const sl = direction === "LONG"
        ? (price - atr * multiplier).toFixed(2)
        : (price + atr * multiplier).toFixed(2);
    return `SL sugerido (ATR×${multiplier}): $${sl} | ATR: $${atr.toFixed(2)}`;
}
