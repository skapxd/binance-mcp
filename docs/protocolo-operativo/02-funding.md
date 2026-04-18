# Funding Rate — Regla Completa

> El funding rate es una señal de **posicionamiento del mercado**, no una señal direccional.
> No es un veto binario — es contexto para calibrar riesgo y tamaño de posición.

---

## Semáforo de funding — siempre consultar DOS fuentes

1. `lastFundingRate` en `/fapi/v1/premiumIndex` = último período cobrado. Puede estar desactualizado hasta 8hs.
2. Historial en `/fapi/v1/fundingRate?limit=4` = últimos 4 períodos. Muestra la **tendencia real**.

| Valor (tendencia) | Estado | Interpretación |
|---|---|---|
| > +0.05% y subiendo | ✅ | Longs pagando, sobreextensión real → apto para short |
| ±0.05% | ⚠️ | Neutro → analizar el resto de señales antes de decidir |
| < -0.05% o empeorando | ⚠️/❌ | Shorts pagando — ver regla contextual abajo |

Si el historial muestra -0.001% → -0.048% → -0.089%: situación peor de lo que el último valor sugiere, aunque el `lastFundingRate` parezca bajo.

---

## Qué significa el funding negativo

Funding negativo NO significa que el precio va a subir. Significa que **el mercado ya está posicionado bajista**.

- Los shorts están pagando → señal de que muchos ya anticiparon la caída
- Si el precio bajó un 20-30% y el funding sigue negativo → hay shorts que sobrevivieron, aumentando riesgo de short squeeze
- Si el precio ya corrigió fuerte y el funding se está normalizando → el posicionamiento bajista se está deshaciendo

**Lección BIOUSDT (lección que generó la regla original):**
Funding -0.82% → el mercado ya apostó masivamente a la baja → precio subió +15% en squeeze. El error fue entrar short con funding muy negativo sin considerar el posicionamiento acumulado.

---

## Regla contextual — 5 filtros (reemplaza el veto binario)

La regla anterior "funding negativo → NO operar short sin excepción" era demasiado rígida.
En ciertos contextos, un short con funding ligeramente negativo es válido con ajuste de tamaño.

### Cuándo se puede operar short con funding negativo leve (−0.05% a −0.10%)

Verificar **los 5 filtros** antes de decidir:

| Filtro | Condición para proceder | Por qué importa |
|---|---|---|
| 1. Precio ya cayó | > 20% desde el pico reciente | El squeeze ya ocurrió; los shorts sobrevivientes son pocos |
| 2. Volumen agotado | > 80% de caída vs el pico de volumen | El pump perdió fuerza, nadie está comprando activamente |
| 3. Mercado general | BTC neutro o bajando | Si BTC sube fuerte puede sostener altcoins incluso sobreextendidas |
| 4. RSI 1h | Entre 50-75 (no sobrecomprado) | RSI >85 con funding negativo = setup más arriesgado |
| 5. Tendencia funding | Mejorando (menos negativo período a período) | Señal de que el posicionamiento bajista se está deshaciendo |

**Si los 5 filtros pasan:**
- Entrar con **50% del capital habitual**
- SL más ajustado: **+5% adicional** sobre el SL estándar
- Reportar el ajuste explícitamente al usuario

**Si falta algún filtro:**
- No entrar. Esperar que el funding se normalice (> 0%) o que los filtros restantes se cumplan.

### Cuándo NO se opera short aunque los filtros parcialmente pasen

- Funding < −0.10% (demasiado posicionamiento bajista acumulado)
- Funding empeorando período a período (tendencia bajista en el funding = squeeze activo)
- BTC subiendo fuerte (> +2% en 4h)

---

## Caso práctico — ALICEUSDT (abr 2026)

Situación: funding −0.27%, precio bajó desde pico, RSI en zona media.
Decisión inicial: esperar que el funding se normalice.

Análisis de los 5 filtros en ese momento:
- ✅ Precio cayó >20% desde pico
- ✅ Volumen agotado
- ✅ Mercado neutro
- ✅ RSI 1h ~55 (zona media)
- ❌ Funding empeorando (−0.18% → −0.27%)

Resultado: filtro 5 no pasó → no entrar. Esperar que el funding gire.
Señal de entrada válida: cuando el historial muestre −0.27% → −0.15% → −0.05% (mejorando).

→ Ver lección completa: [lecciones.md#funding-rate](lecciones.md#funding-rate)

---

## Timing del funding — nextFundingTime

Para saber cuándo cobra el próximo período: consultar `nextFundingTime` en `/fapi/v1/premiumIndex`.
**No calcular manualmente** desde los horarios fijos UTC — el valor exacto puede variar.

Períodos standard (UTC) → convertir siempre a zonas locales:

| Reset UTC | Diego (ARG GMT-3) | Manuel (COL GMT-5) |
|---|---|---|
| 00:00 UTC | 21:00 | 19:00 |
| 08:00 UTC | 05:00 | 03:00 |
| 16:00 UTC | 13:00 | 11:00 |

**Siempre usar `nextFundingTime` del API para el próximo reset exacto** — no estimar.
