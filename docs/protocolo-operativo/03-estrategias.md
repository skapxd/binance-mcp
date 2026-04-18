# Paso 2 — Diseño de Estrategia

**Cuándo:** después de identificar un candidato concreto y haber pasado el checklist de veto del Paso 1.

Claude presenta **siempre mínimo 2 estrategias alternativas** con pros/contras. El usuario elige.

---

## Estructura SHORT — pump sin fundamento

**Lógica:** entrar escalonado desde el pico hacia arriba, capturar la reversión cuando el momentum se agota.
**Horizonte:** máximo 1-1.5 días.

### Paso previo obligatorio: clasificar el tipo de pump

Antes de elegir la estructura de entrada, identificar qué tipo de pump es.
La estrategia de entrada es diferente en cada caso.

---

### Tipo A — Pump gradual (múltiples velas 4h)

**Identificación:**
- 3 o más velas 4h verdes con volumen creciendo progresivamente
- Ninguna vela individual supera 5-7x el volumen promedio reciente
- El precio llegó al pico en horas, no en minutos
- Ejemplo: ORDI (+182% en múltiples velas 4h progresivas)

**Patrón de precio después del pico:**
- Corrección inicial → rebote técnico → segunda bajada más fuerte
- El rebote da tiempo de entrar SHORT LIMIT por encima antes de la caída principal

**Estrategia de entrada:**
```
── ESPERAR REBOTE — entrar en el techo del rebote ──
  Identificar el rebote con 2 velas 15m rojas consecutivas (confirmación bajista)
  Entrada 1: precio pico o +2%  → 40% del capital  ← si rebota cerca del pico
  Entrada 2: precio pico +5%    → 35% del capital  ← si hay spike en el rebote
  Entrada 3: precio pico +10%   → 25% del capital  ← solo si el rebote se extiende

  Plazo para que se llenen: 1-3 horas. Si no llenan → revisar si el pump continúa.
```

---

### Tipo B — Pump de vela única (1 vela 4h explosiva)

**Identificación:**
- UNA sola vela 4h con volumen ≥ 10x el promedio de las últimas 5-8 velas
- La vela puede ser +20% hasta +80% en una sola barra 4h
- Sin acumulación previa — el movimiento fue instantáneo
- Ejemplo: PRLUSDT (vela 4h +54% con 46M USDT vs promedio 1-2M)

**Patrón de precio después del pico:**
- Colapso directo sin rebote técnico significativo
- Entrar LIMIT esperando el rebote = las órdenes nunca se llenan

**Estrategia de entrada — dos caminos:**

```
── CAMINO B1 — Pre-colocar en el pico (si el pump aún no terminó) ──
  Condición: RSI 1h > 90 Y funding positivo (> +0.05%)
  Acción: SELL LIMIT en el precio actual o +2-3% antes de que comience la caída
  Ventaja: si el precio sube un poco más, la orden se llena en el techo
  Riesgo: si el pump continúa, el SL actúa

── CAMINO B2 — MARKET en la primera señal de reversión ──
  Condición: 2 velas 15m rojas consecutivas con volumen ≥ promedio
              + precio ya bajó 2-3% desde el pico
  Acción: entrada MARKET inmediata
  Ventaja: confirmación de reversión antes de entrar
  Riesgo: peor precio de entrada vs B1

  ⚠️ NO esperar un rebote para entrar LIMIT — en pump de vela única el rebote
     generalmente no existe o es < 1-2%. Las LIMIT por encima nunca se llenan.
```

**Señal de alerta temprana:**
- Una vela 15m con volumen > 3x el promedio = posible pump de vela única en formación
- Si en la siguiente vela 15m el volumen sigue alto y el precio acelera → activar Camino B1

---

### Tabla comparativa: ¿cuál tipo es?

| Señal | Tipo A (gradual) | Tipo B (vela única) |
|---|---|---|
| Cantidad de velas 4h verdes en el pump | 3 o más | 1 |
| Volumen pico vs promedio | 2-5x | ≥ 10x |
| Hay rebote después del pico | Sí, de 1-3h | No, o < 1-2% |
| Estrategia de entrada | LIMIT en el rebote | B1: LIMIT en el pico / B2: MARKET |
| Tiempo disponible para analizar | 2-6 horas | 15-30 minutos |

**Si hay duda sobre el tipo:** tratar como Tipo B (más conservador — evita entradas que nunca llenan).

---

### Template SHORT completo

```
Par:              XXXUSDT
Tipo:             SHORT
Capital:          $100 USDT
Leverage:         3x
Exposición total: $300 USDT

── ENTRADAS según tipo de pump ──
  Tipo A: SELL LIMIT en el rebote, POR ENCIMA del precio actual
  Tipo B: SELL LIMIT en el pico (B1) o MARKET en primera vela roja (B2)

  ⚠️ SELL LIMIT por debajo del precio actual = se llena inmediatamente (MARKET).
     Siempre colocar por encima del precio actual para que quede pendiente.

── TOMA DE GANANCIAS (colocar SOLO después que entre la 1era orden) ──
  TP1: precio pico −25%  → cerrar 50% de la posición
  TP2: precio pico −40%  → cerrar el resto

  ⚠️ No colocar TPs antes de tener posición abierta → error -2022 en Hedge Mode.

── PROTECCIONES AUTOMÁTICAS (Claude las coloca via BinanceCustomFuturesAlgoOrder) ──
  ① Stop Loss (STOP_MARKET, closePosition: true):
     Precio: 8-10% por encima de la última entrada
     Tipo: STOP_MARKET (no STOP — en pumps volátiles puede no llenarse)

  ② Trailing Stop (TRAILING_STOP_MARKET, closePosition: true):
     Activación: 3-5% POR DEBAJO del pico del pump
                 NO en el precio de entrada (lección ORDI — cierra antes de tiempo)
     Callback: 6-8%
     Cuándo activar: después de confirmar que la primera entrada llenó

  ③ Take Profit (TAKE_PROFIT_MARKET, closePosition: true):
     TP1: precio pico −25% → cerrar 50%
     TP2: precio pico −40% → cerrar resto (closePosition: true)

  Lógica combinada:
  - Si precio sube después de entrar → SL cierra (pérdida limitada)
  - Si precio baja → TPs fijos capturan 25% y 40% de caída
  - Si precio baja más allá de los TPs → TS sigue capturando el movimiento

Precio de invalidación: X% por encima de la última entrada
Pérdida máxima estimada: $XX USDT (XX% del capital)
```

---

### Modo de entrada urgente — protocolo "urgente orden XXXUSDT"

Cuando el usuario dice "urgente orden XXXUSDT", Claude NO ejecuta ciegamente. Valida en el acto:

```
Usuario: "urgente orden PIPPINUSDT"
         ↓
Claude: valida precio + RSI + última vela 15m (10 segundos)
         ↓
         ¿Confirma el análisis la urgencia?
        /                          \
      SÍ                            NO
  (vela roja fuerte,            (pump sigue activo,
   RSI >80, volumen             RSI <78, velas verdes)
   cayendo en pico)                    ↓
        ↓                     "No veo apuro — genero
  MARKET inmediato             3 LIMIT escalonadas
  + 2 LIMIT arriba             según estrategia"
  para el spike
```

**Modo MARKET (urgente confirmado):**
- Entrada 1: MARKET SHORT inmediata — 40% del capital
- Entrada 2: SELL LIMIT pico +3% — 35% del capital
- Entrada 3: SELL LIMIT pico +7% — 25% del capital

**Modo LIMIT (sin apuro):**
- Entrada 1: SELL LIMIT pico o +2% — 40%
- Entrada 2: SELL LIMIT pico +5% — 35%
- Entrada 3: SELL LIMIT pico +10% — 25%

**Regla de entradas SHORT:** si hay múltiples entradas pendientes y se activa el SL o el TS, **cancelar inmediatamente las entradas no llenadas desde la UI**.

---

## Estructura LONG — altcoin con momentum

**Lógica:** entrar escalonado en dips durante el arranque del movimiento, capturar el trend mientras dure.
**Horizonte:** abierto, sin TP fijo — el trailing stop gestiona la salida.

```
Par:              XXXUSDT
Tipo:             LONG
Capital:          $100 USDT
Leverage:         3x
Exposición total: $300 USDT

── ENTRADAS (BUY LIMIT — precios POR DEBAJO del precio actual) ──
  Entrada 1: precio actual o −2%  → 50% del capital  ← entrada principal
  Entrada 2: precio actual −5%    → 30% del capital  ← si hay dip adicional
  Entrada 3: precio actual −10%   → 20% del capital  ← si hay corrección más profunda

  ⚠️ BUY LIMIT por encima del precio actual = se llena inmediatamente (MARKET).
     Siempre colocar por debajo del precio actual para que quede pendiente.

── TOMA DE GANANCIAS ──
  Sin TP fijo — el objetivo es ride the trend completo.
  El trailing stop captura la ganancia cuando el momentum se agota.

── PROTECCIONES AUTOMÁTICAS (Claude via BinanceCustomFuturesAlgoOrder) ──
  ① Stop Loss (STOP_MARKET, closePosition: true):
     Precio: 8-10% por debajo de la última entrada

  ② Trailing Stop (TRAILING_STOP_MARKET, closePosition: true):
     Activación: 5% POR ENCIMA del precio de la primera entrada
                 (esperar que el precio suba primero antes de activar)
     Callback: 6-8%
     Cuándo activar: cuando la posición esté en ganancia, no antes

  Lógica combinada:
  - Si precio baja después de entrar → SL cierra (pérdida limitada)
  - Si precio sube → TS sigue al precio hacia arriba
  - Cuando el momentum se agota y el precio retrocede → TS cierra con ganancia

Precio de invalidación: si rompe por debajo de la última entrada con volumen alto
Pérdida máxima estimada: $XX USDT (XX% del capital)
```

---

## Diferencia clave LONG vs SHORT

| Aspecto | SHORT | LONG |
|---|---|---|
| Entradas LIMIT | Por encima del precio actual | Por debajo del precio actual |
| TP fijo | Sí — pumps revierten rápido | No — ride the trend |
| TS activación | Cerca del pico (entre pico y entrada) | Cuando el precio ya subió (en ganancia) |
| TS propósito | Capturar ganancia en la bajada | Seguir el precio al alza y cerrar al revertir |
| Horizonte | 1-1.5 días | Abierto |

→ Ver lecciones relacionadas: [lecciones.md#estrategias](lecciones.md#estrategias)
