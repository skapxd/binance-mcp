// MACD 12/26/9 — mismo que Binance UI
// macd = EMA12 - EMA26 | signal = EMA9(macd) | histogram = macd - signal

import { calcEMA } from "./ema.js";

function calcEMASequence(closes: number[], period: number): number[] {
    if (closes.length < period) return [];
    const k = 2 / (period + 1);
    const result: number[] = [];
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);
    for (let i = period; i < closes.length; i++) {
        ema = closes[i] * k + ema * (1 - k);
        result.push(ema);
    }
    return result;
}

export interface MACDResult {
    macd: number;
    signal: number;
    histogram: number;
    trend: string;
}

export function calcMACD(closes: number[], fast = 12, slow = 26, signal = 9): MACDResult {
    const ema12 = calcEMASequence(closes, fast);
    const ema26 = calcEMASequence(closes, slow);

    // MACD line starts where both EMAs exist
    const offset = slow - fast;
    const macdLine = ema26.map((e26, i) => ema12[i + offset] - e26);

    const signalLine = calcEMASequence(macdLine, signal);
    const macdVal = macdLine[macdLine.length - 1];
    const signalVal = signalLine[signalLine.length - 1];
    const histVal = macdVal - signalVal;

    let trend: string;
    if (macdVal > 0 && histVal > 0) trend = "📈 Alcista con momentum";
    else if (macdVal > 0 && histVal < 0) trend = "⚠️ Alcista perdiendo fuerza";
    else if (macdVal < 0 && histVal < 0) trend = "📉 Bajista con momentum";
    else trend = "⚠️ Bajista con posible giro";

    return { macd: macdVal, signal: signalVal, histogram: histVal, trend };
}
