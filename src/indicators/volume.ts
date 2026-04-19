// Volume analysis — ratio y spike detection

export function volumeRatio(volumes: number[]): { avg: number; last: number; ratio: number; label: string } {
    const prev = volumes.slice(0, -1);
    const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
    const last = volumes[volumes.length - 1];
    const ratio = last / avg;

    let label: string;
    if (ratio >= 2) label = "🚀 Spike — posible catalizador";
    else if (ratio >= 1.3) label = "⬆️ Volumen elevado";
    else if (ratio <= 0.5) label = "⬇️ Volumen muy bajo";
    else label = "➡️ Volumen normal";

    return { avg, last, ratio, label };
}

export function fmtVol(v: number): string {
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return v.toFixed(0);
}
