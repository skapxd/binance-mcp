# Colibrí — Scalping Autónomo en Lateralización

> **También conocida como:** scalping autónomo, micro-scalp
>
> ⚠️ **ADVERTENCIA CRÍTICA:**
> Esta estrategia ejecuta órdenes en **PRODUCCIÓN con dinero real** sin intervención humana.
> Una vez activada, Claude monitorea, decide y ejecuta de forma autónoma.
> Solo activar después del análisis previo acordado con el usuario.

---

## Concepto

Detectar pares en lateralización predecible, entrar con leverage alto en micro-correcciones y salir rápido con Trailing Stop. Muchas operaciones pequeñas, capital limitado por trade, sin exposición prolongada.

**Diferencia clave con Ojo de Halcón:**

| | Ojo de Halcón 🦅 | Colibrí 🐦 |
|---|---|---|
| Tipo de setup | Pump reversal — un evento grande | Lateralización — oscilaciones repetidas |
| Capital por trade | $100–$150 | $20 |
| Leverage | 3x | 10–15x |
| Duración del trade | Horas | Minutos |
| Frecuencia | Una operación por activación | Múltiples trades por sesión |
| Dirección | SHORT principalmente | LONG o SHORT según micro-momentum |
| Activación | Cuando hay pump detectado | Después de análisis manual conjunto |

---

## Paso 0 — Pre-activación obligatoria (análisis conjunto)

Colibrí **no se activa sin análisis previo conversacional**. El usuario y Claude acuerdan:

1. **Par elegido** — solo pares líquidos: BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT, BNBUSDT
2. **Confirmación de lateralización** — RSI 1m, 5m y 15m todos entre 35–65, ATR bajo vs promedio reciente
3. **Sin eventos macro** en las próximas 2–3 horas (FOMC, CPI, noticias de alto impacto)
4. **Dirección habilitada** — LONG, SHORT o ambas según el contexto del par
5. **Parámetros confirmados** — capital, leverage, horario estimado de operación

Recién después de este acuerdo el usuario activa con la frase:

```
"Activá Colibrí en SOLUSDT — capital $20 — leverage 10x — dirección LONG/SHORT/ambas"
```

**Ejecutar `/compact` antes de confirmar la activación** para liberar contexto durante la ejecución autónoma.

---

## Paso 1 — Activación de permisos

Claude edita `.claude/settings.jsonc` y agrega al `allow`:
```
BinanceCustomFuturesNewOrder
BinanceCustomFuturesAlgoOrder
BinanceCustomFuturesCancelAlgoOrder
```

El usuario recarga Claude Code (Ctrl+Shift+P → Reload Window).
A partir de ahí las órdenes se ejecutan sin popup de confirmación.

---

## Arquitectura del ciclo

```
[FASE 1 — VIGILANCIA — cron 5min, durable: true]
  → BinanceCustomFuturesAnalyze del par acordado
  → Verificar condiciones de lateralización (ver abajo)
  → Si NO se cumplen: reportar 1 línea y esperar
  → Si SE CUMPLEN: crear cron 30s → pasar a Fase 2

[FASE 2 — ENTRADA — cron 30s]
  Ciclo A:
    → Obtener precio actual
    → Determinar dirección (RSI micro-momentum)
    → Colocar LIMIT entry:
         LONG:  precio − 0.1%
         SHORT: precio + 0.1%
    → Reportar orden colocada

  Ciclo B (30 segundos después):
    → Verificar si la LIMIT llenó
    → SI llenó → pasar a Fase 3
    → NO llenó → cancelar orden (BinanceCustomFuturesCancelAlgoOrder)
                → re-evaluar condiciones:
                     Condiciones siguen válidas → nueva LIMIT precio actualizado
                     Condiciones cambiaron → eliminar cron 30s → volver Fase 1

[FASE 3 — GESTIÓN DEL TRADE]
  Una vez que entró la primera orden:
  → Colocar SL via BinanceCustomFuturesAlgoOrder
  → Colocar Trailing Stop via BinanceCustomFuturesAlgoOrder
  → Reportar estructura completa en chat
  → Esperar cierre (TS o SL activa)
  → Al cerrar: reportar resultado → volver a Fase 1 para siguiente trade

[PASO FINAL — DESACTIVACIÓN]
  Cuando el usuario dice "desactivá Colibrí" o al finalizar la sesión acordada:
  → Claude remueve los 3 permisos de ejecución de .claude/settings.jsonc
  → Reportar resumen: N trades, ganancia/pérdida total
```

---

## Condiciones de entrada (Fase 1)

Para que Claude considere válido el setup, se deben cumplir **todos**:

| Condición | Requisito | Por qué |
|---|---|---|
| RSI 1h | Entre 35–65 | Marco principal sin tendencia definida |
| RSI 5m | Entre 35–65 | Confirma lateralización en marco intermedio |
| RSI 15m | Entre 40–60 | Sin momentum direccional activo |
| Rango intradiario | ≥ 3% (high−low del día) | Rango menor = movimientos insuficientes para cubrir fees |
| Volatilidad 15m | Velas de ≥ 0.4% promedio (últimas 6) | Velas menores → TS de 0.5% nunca captura ganancia real |
| Funding | Entre −0.05% y +0.05% | Funding extremo = sesgo direccional fuerte |
| Volumen 15m | ≥ 1M USDT por vela promedio | Menor volumen → slippage invalida el edge con $200 de exposición |
| Volumen 15m | Sin spike (< 2x promedio últimas 6) | Spike = catalizador que rompe lateralización |
| Velas 4h | No más de 2 consecutivas del mismo color en las últimas 4 | 3+ consecutivas = tendencia disfrazada, no lateral. Dos velas de ±0.5% del mismo color no son drift real. |

**Si alguna condición falla → no entrar.** Esperar siguiente ciclo de 5min.

### Condición adicional: timing dentro del rango

No entrar en el medio de un movimiento activo (6+ velas 15m del mismo color).
Esperar que el movimiento se agote y el RSI 15m vuelva a zona 40-55 antes de colocar la LIMIT.

## Dirección micro-momentum (Fase 2)

Una vez en Fase 2, la dirección se define por el RSI 1m en el momento:

| RSI 1m | Dirección | Lógica |
|---|---|---|
| 35–45 | LONG | Precio en zona baja del rango, rebote esperado |
| 55–65 | SHORT | Precio en zona alta del rango, corrección esperada |
| 45–55 | No entrar | Zona neutra, sin micro-momentum claro |

---

## Parámetros de la operación

```
Capital por trade:  $20 USDT
Leverage:           10x (default) — hasta 15x si el par lo permite
Exposición total:   $200 USDT
Margen:             ISOLATED (siempre)
positionSide:       LONG o SHORT (Hedge Mode en producción)

── ENTRADA ──
  Tipo:    LIMIT
  LONG:    precio actual − 0.1%  (debajo del mercado → llena al continuar la subida)
  SHORT:   precio actual − 0.1%  (debajo del mercado → llena al continuar la bajada)
  Plazo:   60 segundos — si no llena → cancelar

  ⚠️ Lección (primer test): SHORT con precio + 0.1% no llenó nunca porque
  requería que el precio subiera primero, contrario al momentum bajista esperado.
  Ambas entradas van en −0.1% para asegurar fill casi cierto.

── STOP LOSS (BinanceCustomFuturesAlgoOrder) ──
  Tipo:          STOP_MARKET, closePosition: true
  LONG:          entrada − 0.5%
  SHORT:         entrada + 0.5%

── SALIDA (BinanceCustomFuturesAlgoOrder) ──
  Tipo:          TRAILING_STOP_MARKET, closePosition: true
  Callback:      0.5%
  Activación:    inmediata desde el precio de entrada
```

**Sin TP fijo** — el Trailing Stop gestiona toda la salida. Captura desde 1% hasta lo que el movimiento dé, cerrando cuando el precio retrocede 0.5% desde el máximo.

---

## Gestión de riesgo

- **Máximo 5 trades por sesión** — si los primeros 3 son perdedores → parar y reportar al usuario
- **Pérdida máxima por trade:** $20 × 10x × 0.5% = **$1 USDT**
- **Ganancia mínima esperada por trade:** 1% real ≈ $2 USDT (después de fees)
- **Fees por trade:** ~$0.08 USDT (maker entrada 0.02% + taker salida 0.04% sobre $200)
- **Solo pares líquidos** — sin altcoins de bajo volumen (slippage invalida el edge)

---

## El prompt del cron (autocontenido)

El prompt debe incluir todo el contexto necesario porque no puede asumir historial:

```
Colibrí activo en [SÍMBOLO]. Capital $20, leverage [X]x, dirección [LONG/SHORT/ambas].
Condiciones de entrada: RSI 1m+5m+15m entre 35-65, ATR bajo, funding neutro, sin spike de volumen.
Dirección micro-momentum: RSI 1m 35-45 → LONG, RSI 1m 55-65 → SHORT, 45-55 → no entrar.
Entrada: LIMIT 0.1% a favor. Si no llena en 30s → cancelar.
Cuando llene: SL 0.5% en contra + TS callback 0.5% via BinanceCustomFuturesAlgoOrder.
Máximo 5 trades. Reportar cada acción en el chat. No preguntar al usuario.
Estado actual: [VIGILANCIA / ESPERANDO FILL / EN TRADE — qty X entry $X.XX]
```

---

## Aprendizajes (actualizar después del primer test)

| Fecha | Lección |
|---|---|
| 2026-04-18 | Entrada SHORT con +0.1% nunca llenó — requería precio subir antes de caer. Corregido a −0.1% para ambas direcciones. |
| 2026-04-18 | Contexto se agota rápido con cron de 1min — viable en sesiones cortas con /compact previo, no apto para autónomo sin supervisión prolongada. |
| 2026-04-18 | Condición 9 (4h alternación estricta) demasiado restrictiva: dos velas 4h del mismo color de +0.4-0.6% no indican drift real. Criterio correcto: vetar solo si hay 3+ velas 4h consecutivas del mismo color. |
| 2026-04-18 | RSI 15m oscila en el borde del umbral (39-41) durante downtrends suaves — el criterio "≥40" es correcto y no debe relajarse; si RSI 15m no puede superar 40 sostenidamente, el par no está lateralizando. |
| 2026-04-18 | Distinguir lateralización real de drift bajista lento: si RSI 15m se mantiene bajo 40 por 5+ ciclos consecutivos, el par no es apto para Colibrí — cambiar de par o esperar. |
| 2026-04-18 | RSI 1m puede quedarse en zona 0-20 durante minutos cuando hay una caída fuerte en 15m. No es bug — es señal de que el momentum bajista no terminó. Esperar rebote a zona 35-45 antes de entrar LONG. |

---

## Cómo desactivar

```
"Desactivá Colibrí"
```

Claude cancela todos los crons activos, cancela órdenes pendientes si las hay, reporta resumen y remueve permisos de ejecución de `.claude/settings.jsonc`.
