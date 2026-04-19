// EMA — Exponential Moving Average
// Usado para EMAs 7/25/99 en 1h (estructura de tendencia)

export function calcEMA(closes: number[], period: number): number {
    if (closes.length < period) return NaN;
    const k = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < closes.length; i++) {
        ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
}

export function emaStructure(price: number, ema7: number, ema25: number, ema99: number): string {
    const above = (e: number) => price > e;
    if (above(ema7) && above(ema25) && above(ema99)) return "📈 Alcista — precio sobre todas las EMAs";
    if (!above(ema7) && !above(ema25) && !above(ema99)) return "📉 Bajista — precio bajo todas las EMAs";
    if (above(ema99) && !above(ema25)) return "⚠️ Corrección en tendencia alcista";
    if (!above(ema99) && above(ema25)) return "⚠️ Rebote en tendencia bajista";
    return "↔️ Mixto";
}
