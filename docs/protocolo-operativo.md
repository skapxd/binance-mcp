# Protocolo Operativo — Del Análisis a la Ejecución

> Este documento es la referencia operativa completa del sistema.
> CLAUDE.md apunta aquí para todos los detalles de ejecución.
> Última actualización: 2026-04-18

---

## El flujo completo en 5 pasos

```
1. ANÁLISIS DE MERCADO
       ↓
2. DISEÑO DE ESTRATEGIA  (SHORT o LONG — estructuras diferentes)
       ↓
3. VALIDACIÓN EN TESTNET
       ↓
4. REVISIÓN FINAL
       ↓
5. EJECUCIÓN EN PRODUCCIÓN (modelo híbrido)
```

---

## Paso 1 — Análisis de mercado

**Cuándo:** cuando el usuario pide un escaneo o quiere evaluar un símbolo.

---

### 1a — Contexto macro PRIMERO (obligatorio antes de analizar cualquier moneda)

Antes de ver candidatos individuales, Claude siempre reporta el estado de BTC y el mercado general. El contexto macro cambia el riesgo de cualquier trade.

**Qué consultar:**
- BTC: precio, cambio 24h, RSI 1h, tendencia de velas 4h (últimas 4), velas 15m (últimas 6)
- ETH: cambio 24h como confirmación de sentimiento general
- Dominancia implícita: si BTC y ETH suben → altcoins pueden pump más / si BTC cae → altcoins amplifican la bajada

**Semáforo macro — cómo afecta a cada estrategia:**

| Estado BTC | Impacto SHORT en altcoin pumpeada | Impacto LONG momentum |
|---|---|---|
| BTC lateral (±0.5% en 4h) | ✅ Neutral — el pump se sostiene o cae por su propia lógica | ⚠️ Longs dependen del catalizador propio |
| BTC subiendo fuerte (+2%+ en 4h) | ⚠️ Riesgo: las altcoins pumpeadas pueden extenderse más. Esperar agotamiento claro antes de shortear | ✅ Favorable — el mercado está en risk-on |
| BTC cayendo fuerte (-2%+ en 4h) | ✅ Favorable — la bajada de BTC acelera la caída de altcoins pumpeadas | ❌ No entrar long — BTC arrastra altcoins hacia abajo aunque tengan momentum propio |
| BTC en corrección leve (-0.5% a -1.5%) | ✅ Puede confirmar el agotamiento del pump en altcoin | ⚠️ Los longs aguantan si el catalizador es fuerte, pero reducir tamaño |

**Output del contexto macro (siempre al inicio del reporte):**

```
🌐 CONTEXTO MACRO
  BTC: $XX,XXX | 24h: +X.X% | RSI 1h: XX | Tendencia 4h: [lateral / alcista / bajista]
  ETH: $X,XXX  | 24h: +X.X%
  Mercado general: [risk-on / lateral / risk-off]

  → Impacto en análisis de hoy: [ej. "BTC lateral — pumps en altcoins se mueven por lógica propia. Favorable para shorts en sobreextendidos."]
```

---

### 1b — Análisis de candidatos individuales

**Qué hace Claude:**
1. Obtener todos los tickers de futuros (`/fapi/v1/ticker/24hr`) + `exchangeInfo` en paralelo
2. Cruzar ambos y filtrar solo `status=TRADING` — la API devuelve también contratos SETTLING que no aparecen en la UI del usuario
3. Consultar `availableBalance` de `/fapi/v2/balance` — mostrar capital disponible al inicio del reporte
4. Filtrar candidatos por categoría:
   - **Pumpeadas** (short): cambio 24h > 20%, volumen > $5M
   - **Laterales** (grid): cambio 24h entre -3% y +3%, volumen > $10M
   - **Con momentum** (long): volumen creciendo, RSI saliendo de zona 30-45, MACD girando positivo
5. Para cada candidato filtrado, analizar en detalle:
   - RSI en 1h y 4h
   - MACD en 1h
   - ATR 4h (volatilidad)
   - Funding rate: **siempre DOS fuentes** (ver semáforo abajo)
   - Orderbook ratio bid/ask
   - Klines 4h últimas 6 velas + klines 15m últimas 8 velas
   - Volumen por vela: ¿cayendo (agotamiento) o subiendo (momentum activo)?
   - **Correlación con BTC en ese momento:** si BTC bajó mientras la altcoin subió → pump desacoplado (más fuerte/más riesgoso). Si subieron juntos → pump dependiente del mercado general.

---

### 1c — Análisis de moneda específica (cuando el usuario pregunta por una)

Cuando el usuario pregunta "cómo ves X" o "analizá X", el reporte siempre tiene esta estructura:

```
=== XXXUSDT — análisis ===

🌐 Contexto macro ahora
  BTC: $XX,XXX | tendencia 15m: [lateral/subiendo/bajando]
  Impacto: [ej. "BTC lateral = el movimiento de XXXUSDT es por catalizador propio, no arrastre"]

📊 Señales técnicas
  Precio: $X.XX | 24h: +XX% | Pico: $X.XX | Dist desde pico: -X%
  RSI 1h: XX [sobreextendido / neutral / oversold]
  Funding: X.XXXX% | Historial: X→X→X→X [tendencia: positiva / negativa]
  OB ratio: X.XX [compradores / vendedores dominan]
  Volumen: [cayendo X% desde pico / creciendo / estable]

🕯️ Estructura de velas
  4h (últimas 5): [patrón — ej. "pump gradual, Tipo A" o "vela única, Tipo B"]
  15m (últimas 8): [dirección actual — ej. "bajista confirmado" / "rebotando" / "sin dirección"]

⚡ Conclusión
  Setup: [✅ válido / ⚠️ señales mixtas / ❌ no operar]
  Por qué: [razón concreta en 1-2 líneas]
  Qué esperar: [escenario A y escenario B dependiendo del precio]
  Alarma sugerida: $X.XX [condición para que se active el setup]
```

Este formato aplica tanto para análisis de oportunidades como para seguimiento de posiciones abiertas.

---

**Output del escaneo general:** tabla clasificada con contexto macro al inicio. Claude presenta **mínimo 2 opciones de estrategia** y la opción "no operar".

```
🌐 CONTEXTO MACRO
  BTC: $XX,XXX | +X.X% | RSI: XX | Tendencia: lateral
  → Impacto: BTC sin dirección — altcoins se mueven por catalizador propio hoy

💰 Capital disponible: $XX USDT

🔴 NO OPERAR ahora:
  XXXUSDT +120% — funding negativo (-0.08%), squeeze activo
  YYYUSDT +80%  — volumen subiendo, pump sin agotamiento

⚠️ EN RADAR (señales mixtas o requiere más capital):
  ZZZUSDT +65% — funding ✅ pero volumen aún no cae
                  Requiere $XX para mínimo UI

✅ SETUP VÁLIDO — propongo 2 estrategias:
  WWWUSDT +90% — funding ✅ +0.19%, volumen cayó 70%, confirmación bajista activa
  [A] Conservadora: ...
  [B] Agresiva: ...
```

Claude NO elige por el usuario. Si no hay setup válido → decirlo claramente y siempre cerrar con la sección de alarmas:

```
📵 SIN SETUP AHORA — qué vigilar

  Par           Alarma        Condición para entrar
  XXXUSDT       $X.XX ↑       RSI >78 en ese precio + volumen bajo
  YYYUSDT       $X.XX ↓       RSI <30 + 2 velas 15m verdes con volumen

  → Poné estas alarmas en la app de Binance (Futuros → par → campanita)
    Cuando suene: avisame y analizamos en el momento si confirma entrada.
```

Esto aplica siempre que haya candidatos en radar pero sin señal de entrada inmediata.

### 🕐 Temporalidades — siempre especificar en cada dato

Claude siempre aclara la temporalidad junto al dato. Nunca decir "RSI alto" o "velas rojas" sin la vela de referencia.

| Dato | Temporalidad usada | Por qué |
|---|---|---|
| RSI | **1h** | Es lo que devuelve `BinanceCustomFuturesAnalyze`. Captura el momentum relevante sin ruido de 1m. |
| Velas de análisis | **4h** | Para leer la fase del pump (Tipo A/B, agotamiento, estructura macro). |
| Velas de entrada | **15m** | Para confirmar reversión antes de ejecutar. |
| Volumen de confirmación | **15m** | Comparar las últimas 4-6 velas 15m para detectar spike o caída. |

Ejemplo correcto: *"RSI 1h <45 + 2 velas 15m verdes con volumen creciente → long rebote"*
Ejemplo incorrecto: *"RSI bajo y velas verdes con volumen"* ← temporalidad omitida, no operable.

---

### 📐 Unidades de volumen — Claude vs UI de Binance

Claude reporta volumen en **USDT** (quoteVolume). La UI de Binance muestra volumen en **cantidad de la moneda base** (ej. PIPPIN, ORDI, etc.).

Conversión: `volumen en moneda = volumen USDT / precio actual`

Ejemplo con PIPPIN a $0.0425:
- Claude dice: "vela 2.76M" → en tu gráfico ves ~65M PIPPIN
- Claude dice: "≥1.5M USDT" → en tu gráfico es ≥35M PIPPIN

**Cuando Claude da umbrales de volumen para señales, siempre incluye el equivalente en coins** para que el usuario pueda leerlo directo en su gráfico sin calcular.

---

### ⛔ Checklist de VETO para shorts en pumps — ejecutar en este orden

**Paso 0 — Capital:**
- Consultar `availableBalance` en `/fapi/v2/balance`
- Si capital < $20 → no hay trade posible
- Verificar mínimo UI: `qty_min_UI = 1000 / precio_actual`. Si capital × 3 < qty_min_UI → usuario no puede colocar SL manual → trade inviable

**Pasos 1-5 — Solo si el capital es suficiente:**

| Condición | Señal requerida | Por qué |
|---|---|---|
| Funding rate | **Debe ser positivo** (> +0.05%) | Negativo = mercado ya está short = riesgo de squeeze. Lección BIOUSDT: funding -0.82% → precio subió +15% |
| Volumen en el pico | **Debe estar cayendo** vs velas anteriores | Si el volumen sigue alto, el pump no terminó |
| RSI 1h | > 85 **y cayendo**, o con divergencia bajista | RSI alto solo no alcanza si el momentum sigue |
| MACD 1h | Girando o cruzando a la baja | MACD positivo creciente = pump activo |
| Distancia desde mínimos | Pump ≥ 100% desde el inicio | Pumps menores tienen más probabilidad de continuar |

**Si el funding es negativo → NO operar short. Sin excepción.**

### 📊 Semáforo de funding rate — siempre consultar DOS fuentes

1. `lastFundingRate` en `/fapi/v1/premiumIndex` = último período cobrado. Puede estar desactualizado hasta 8hs.
2. Historial en `/fapi/v1/fundingRate?limit=4` = últimos 4 períodos. Muestra la **tendencia real**.

| Valor (tendencia) | Estado | Acción |
|---|---|---|
| > +0.05% y subiendo | ✅ | Longs pagando, sobreextensión real → apto para short |
| ±0.05% | ⚠️ | Neutro → analizar el resto de señales antes de decidir |
| < -0.05% o empeorando | ❌ | Shorts pagando, mercado ya apostó a la baja → NO shortear |

Si el historial muestra -0.001% → -0.048% → -0.089%: situación peor de lo que el último valor sugiere, aunque el `lastFundingRate` parezca bajo.

### 📊 Fases del pump — leer en velas 4h antes de entrar short

```
Fase 1 — Arranque:    vela 4h verde +20%/+30%, volumen creciendo → NO shortear
Fase 2 — Aceleración: vela 4h verde +10%/+20%, volumen alto     → NO shortear
Fase 3 — Agotamiento: vela 4h pequeña o roja, volumen cayendo   → EVALUAR short
Fase 4 — Corrección:  vela 4h roja -10%/+20%, volumen medio     → ESPERAR rebote
Fase 5 — Rebote:      vela 4h verde con poco volumen            → EVALUAR: si RSI
                                                                    sube a >75 acá
                                                                    → short en el techo
```

Shortear en Fase 4 o 5 sin RSI alto = entrar en corrección normal, no en reversión.
El mejor momento: rebote de Fase 5 lleva el RSI de vuelta a >75-80 con volumen bajo.

### ✅ Confirmación bajista — cuándo se puede entrar short

No entrar solo porque el precio baja un poco. Confirmación requiere **al menos 2 de estos 3**:
1. **2 velas 15m consecutivas en rojo** con cierre por debajo de la apertura anterior
2. **Volumen en las velas rojas ≥ volumen promedio** de las últimas 4 velas
3. **Precio rompe un soporte claro** — mínimo de la última hora o zona de consolidación previa

Una sola vela roja no es confirmación. El usuario apurado siguiendo el precio = señal de esperar.

**Señal adicional: mecha larga en el pico (lección ENAUSDT — abr 2026)**
Si el pico de la vela muestra una mecha larga (precio llegó arriba y rechazó rápido sin cierre alto) → liquidación de longs confirmada. Es la señal más clara de agotamiento. En ese caso el Camino B2 (MARKET en la primera vela roja) es más efectivo que esperar LIMIT en el rebote — el rebote generalmente no llega al precio de la mecha.

### ✅ Checklist de ENTRADA para longs con momentum

| Condición | Señal requerida |
|---|---|
| RSI 1h | Saliendo de zona 30-45, cruzando al alza |
| MACD 1h | Cruzando la señal hacia arriba o girando positivo |
| Volumen | Creciendo vs las últimas 4-6 velas — acumulación activa |
| Funding | Neutro o ligeramente positivo (no sobreextendido) |
| Contexto | Coin pequeña, sin posición dominante de mercado — más explosividad potencial |

NO entrar long si el volumen no confirma. Muchos "cruces de RSI" son falsas señales sin volumen.

---

## Paso 2 — Diseño de estrategia

**Cuándo:** después de identificar un candidato concreto **y haber pasado el checklist de veto del Paso 1.**

Claude presenta **siempre mínimo 2 estrategias alternativas** con pros/contras. El usuario elige.

---

### Estructura SHORT — pump sin fundamento

**Lógica:** entrar escalonado desde el pico hacia arriba, capturar la reversión cuando el momentum se agota.
**Horizonte:** máximo 1-1.5 días.

#### ⚡ Paso previo obligatorio: clasificar el tipo de pump

Antes de elegir la estructura de entrada, identificar qué tipo de pump es.
La estrategia de entrada es diferente en cada caso.

---

#### Tipo A — Pump gradual (múltiples velas 4h)

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

#### Tipo B — Pump de vela única (1 vela 4h explosiva)

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

**Señal de alerta temprana (para detectar antes que pique):**
- Una vela 15m con volumen > 3x el promedio = posible pump de vela única en formación
- Si en la siguiente vela 15m el volumen sigue alto y el precio acelera → activar Camino B1

---

#### Tabla comparativa: ¿cuál tipo es?

| Señal | Tipo A (gradual) | Tipo B (vela única) |
|---|---|---|
| Cantidad de velas 4h verdes en el pump | 3 o más | 1 |
| Volumen pico vs promedio | 2-5x | ≥ 10x |
| Hay rebote después del pico | Sí, de 1-3h | No, o < 1-2% |
| Estrategia de entrada | LIMIT en el rebote | B1: LIMIT en el pico / B2: MARKET |
| Tiempo disponible para analizar | 2-6 horas | 15-30 minutos |

**Si hay duda sobre el tipo:** tratar como Tipo B (más conservador — evita entradas que nunca llenan).

---

```
Par:              XXXUSDT
Tipo:             SHORT
Capital:          $100 USDT
Leverage:         3x
Exposición total: $300 USDT

── ENTRADAS según tipo de pump (ver tabla arriba) ──
  Tipo A: SELL LIMIT en el rebote, POR ENCIMA del precio actual
  Tipo B: SELL LIMIT en el pico (B1) o MARKET en primera vela roja (B2)

  ⚠️ SELL LIMIT por debajo del precio actual = se llena inmediatamente (MARKET).
     Siempre colocar por encima del precio actual para que quede pendiente.

── TOMA DE GANANCIAS (BUY LIMIT — colocar SOLO después que entre la 1era orden) ──
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
                     ⚠️ error -2022 si no hay posición abierta al colocar

  ③ Take Profit (TAKE_PROFIT_MARKET, closePosition: true):
     TP1: precio pico −25% → cerrar 50% (quantity: mitad de la posición)
     TP2: precio pico −40% → cerrar resto (closePosition: true)

  Lógica combinada:
  - Si precio sube después de entrar → SL cierra (pérdida limitada)
  - Si precio baja → TPs fijos capturan 25% y 40% de caída
  - Si precio baja más allá de los TPs → TS sigue capturando el movimiento

Precio de invalidación: X% por encima de la última entrada
Pérdida máxima estimada: $XX USDT (XX% del capital)
```

#### ⚡ Modo de entrada urgente — protocolo "urgente orden XXXUSDT"

Cuando el usuario dice **"urgente orden XXXUSDT"** (o similar), Claude NO ejecuta ciegamente. Valida en el acto y decide:

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

**Regla clave:** el usuario activa la alerta, Claude valida y decide el modo. Si el análisis de Claude contradice la urgencia del usuario → Claude lo dice explícitamente ("no veo apuro") y explica por qué antes de ejecutar las LIMIT. El usuario siempre puede insistir y Claude ejecuta MARKET igualmente si el usuario confirma.

**Regla de entradas SHORT:** si hay múltiples entradas pendientes y se activa el SL o el TS, **cancelar inmediatamente las entradas no llenadas desde la UI**. Una entrada que se llena después de cerrar la posición abre una nueva exposición no controlada.

---

### Estructura LONG — altcoin con momentum

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

── PROTECCIONES MANUALES (UI de Binance — configurar INMEDIATAMENTE después de las entradas) ──
  ① Stop Loss (Stop Market):
     Precio: 8-10% por debajo de la última entrada
     Tipo: Stop Market

  ② Trailing Stop:
     Activación: 5% POR ENCIMA del precio de la primera entrada
                 (esperar que el precio suba primero antes de activar)
     Callback: 6-8%
     Cuándo activar: cuando la posición esté en ganancia, no antes

  Lógica combinada:
  - Si precio baja después de entrar → SL cierra (pérdida limitada)
  - Si precio sube → TS sigue al precio hacia arriba
  - Cuando el momentum se agota y el precio retrocede X% → TS cierra con ganancia

Precio de invalidación: si rompe por debajo de la última entrada con volumen alto
Pérdida máxima estimada: $XX USDT (XX% del capital)
```

**Diferencia clave LONG vs SHORT:**

| Aspecto | SHORT | LONG |
|---|---|---|
| Entradas LIMIT | Por encima del precio actual | Por debajo del precio actual |
| TP fijo | Sí — pumps revierten rápido | No — ride the trend |
| TS activación | Cerca del pico (entre pico y entrada) | Cuando el precio ya subió (en ganancia) |
| TS propósito | Capturar ganancia en la bajada | Seguir el precio al alza y cerrar al revertir |
| Horizonte | 1-1.5 días | Abierto |

---

## Paso 3 — Validación en testnet

**Cuándo:** al configurar el sistema por primera vez, o si aparece un error nuevo en producción.
**NO es obligatorio antes de cada operación** — LIMIT/MARKET ya están validados.
**Comando:** `node testnet-validator.js` desde la raíz del proyecto.

### Estado validado de endpoints (actualizado 2026-04-16)

| Tipo | Estado |
|---|---|
| `LIMIT` | ✅ Funciona |
| `MARKET` | ✅ Funciona |
| `STOP_MARKET` | ❌ -4120 (bloqueado por Binance) |
| `TAKE_PROFIT_MARKET` | ❌ -4120 (bloqueado por Binance) |
| `TRAILING_STOP_MARKET` | ❌ -4120 (bloqueado por Binance) |

Si algún resultado cambia → actualizar `docs/api-reference/capacidades-mcp.md`.

### Simular la estrategia en testnet (3b)

Ejecutar las órdenes exactas en testnet: mismos precios, mismas cantidades, mismo leverage.
Verificar que todas se crean correctamente y respetan los filtros del símbolo.

**Solo si 3b pasa sin errores → avanzar al paso 4.**

---

## Paso 4 — Revisión final antes de producción

Checklist que Claude verifica antes de ejecutar con capital real:

- [ ] ¿El precio sigue dentro del rango analizado? (revalidar precio actual)
- [ ] ¿El funding rate sigue siendo favorable a la estrategia?
- [ ] ¿El RSI no cambió significativamente desde el análisis?
- [ ] ¿Hay noticias macro pendientes en las próximas 4hs? (FOMC, CPI, etc.)
- [ ] ¿El capital a usar representa menos del 20% del capital total disponible?
- [ ] ¿Tiene stop loss definido aunque sea monitoreado manualmente?
- [ ] ¿El usuario confirmó la ejecución explícitamente?

Si algún punto falla → volver al paso 1.

---

## Paso 5 — Ejecución en producción (modelo híbrido)

El sistema opera en modo **híbrido**: Claude ejecuta via API, el usuario hace manualmente lo que Binance bloquea.

### Lo que Claude ejecuta

| Acción | Tipo | Estado |
|---|---|---|
| Entradas escalonadas | LIMIT | ✅ |
| Take Profit (solo después de tener posición) | LIMIT | ✅ |
| Cierre de emergencia | MARKET | ✅ si el usuario lo pide |

### Lo que el usuario hace manualmente (UI de Binance)

| Acción | Por qué manual | Dónde |
|---|---|---|
| Stop Loss | STOP_MARKET bloqueado (-4120) | Futures → posición → Add SL/TP |
| Trailing Stop | TRAILING_STOP bloqueado (-4120) | Futures → posición → Trailing Stop |
| Cancelar entradas pendientes si SL/TS activa | Evitar nueva exposición no controlada | Futures → Open Orders → cancelar |
| Grid bots | Endpoint no público | Futures → Bot Trading → Grid |

### Protocolo de entorno — declarar SIEMPRE antes de ejecutar

**Testnet:**
```
🔵 ENTORNO: TESTNET — build/.env.testnet — fapi: testnet.binancefuture.com
```

**Producción — mostrar alerta y esperar confirmación explícita:**
```
🔴 ENTORNO: PRODUCCIÓN — build/.env — fapi: fapi.binance.com
⚠️  ALERTA: estamos por ejecutar una orden con dinero real.
    Par: XXXUSDT | Tipo: SELL SHORT LIMIT | Precio: $X.XX | Qty: XX
    Confirmás? (sí / no)
```

Esta alerta se muestra **siempre** antes de producción, aunque el usuario ya haya confirmado la estrategia.

### Formato de presentación — dividir siempre en dos bloques

```
═══════════════════════════════════════════════════
 CLAUDE EJECUTA (via API)
═══════════════════════════════════════════════════
  • Entrada 1: LIMIT [SELL/BUY] @ $X.XX — qty XX
  • Entrada 2: LIMIT [SELL/BUY] @ $X.XX — qty XX
  • TP1: LIMIT [BUY/SELL] @ $X.XX — qty XX  ← colocar después de 1era entrada
  • TP2: LIMIT [BUY/SELL] @ $X.XX — qty XX

═══════════════════════════════════════════════════
 VOS CONFIGURÁS MANUALMENTE (UI Binance)
 → Futures → Positions → [PAR] → Edit
═══════════════════════════════════════════════════
  ① Stop Loss (Stop Market): $X.XX
  ② Trailing Stop:
       Activación: $X.XX  ← [SHORT: cerca del pico | LONG: cuando estás en ganancia]
       Callback:   6%
═══════════════════════════════════════════════════
```

Claude no ejecuta hasta que el usuario confirma que entendió ambas partes.

### Orden de ejecución

1. Declarar entorno (🔵 testnet / 🔴 producción + alerta)
2. Esperar confirmación del usuario si es producción
3. Claude coloca todas las LIMIT entries
4. Claude coloca los LIMIT de Take Profit **solo después que entre la 1era orden** (error -2022 si no hay posición)
5. Claude muestra el instructivo de SL + TS con los precios calculados para ese setup
6. Usuario confirma que colocó SL + TS
7. Registrar en watchlist

### Durante la operación

- Claude verifica precio y estado cuando el usuario lo consulta
- Si el precio se acerca al nivel de riesgo → Claude avisa y propone cerrar con MARKET
- Si SL o TS activa → Claude recuerda cancelar entradas pendientes desde la UI
- El usuario siempre decide la acción final

---

## Limitaciones del sistema (a 2026-04-16)

| Limitación | Impacto | Workaround |
|---|---|---|
| STOP_MARKET no disponible via API | No hay stop automático | Stop Market manual desde UI inmediatamente post-ejecución |
| TRAILING_STOP no disponible via API | No hay TS automático | Trailing Stop manual desde UI |
| Grids de futuros no disponibles via API | No crear grids desde Claude | Crear desde UI de Binance |
| Hedge Mode en cuenta real | Todas las órdenes requieren `positionSide` | Siempre incluir LONG/SHORT |
| Testnet en One-way Mode | Scripts deben adaptarse al modo | No enviar `positionSide` en testnet |
| TP en Hedge Mode | No se puede colocar antes de tener posición | Colocar TP solo después de la primera entrada |

---

## Monitor automático — Script de seguimiento (loop)

### Qué es

`scripts/monitor.cjs` — script Node.js que consulta la API de Binance cada vez que se ejecuta y detecta señales de entrada o invalidación. Claude lo corre cada minuto via cron cuando el usuario pide monitoreo continuo.

### Cómo activarlo

El usuario dice: **"enciende loop XXXUSDT"** o **"monitorea XXXUSDT"**

Claude crea un cron de 1 minuto con:
```
node "d:\PROGRAMACION\binance bot\binance-mcp\scripts\monitor.cjs"
```

Variables de entorno configurables (pasar antes del comando o editar defaults en el script):
```
SYMBOL=XXXUSDT RSI_MIN=35 VOL_MIN=5 PRICE_MIN=6.00 STOP=5.80 TP=6.70 SL=5.75
```

### ¿Pide confirmación?

**No** — el path exacto está en `.claude/settings.json` bajo `permissions.allow`. Claude Code auto-permite ese comando sin pedir confirmación al usuario.

Si el script da error de módulo (ES module vs CommonJS), usar siempre la extensión **`.cjs`**, no `.js`.

### Condiciones que reporta

| Salida | Significado | Acción |
|---|---|---|
| línea con datos | Sin señal — seguir esperando | Nada |
| `🟢🟢 SEÑAL LONG` | Todas las condiciones cumplidas | Notificar al usuario urgente |
| `🔴 INVALIDADO` | Precio rompió el stop | Notificar + cancelar cron |

### Condiciones default (long rebote)
1. RSI 15m cruza por encima de 35
2. Última vela 15m cierra verde
3. Volumen última vela > 5M USDT
4. Precio sosteniendo por encima del PRICE_MIN

### Cómo detenerlo

Usuario dice: **"para el loop"** → Claude ejecuta `CronDelete <job_id>`.

---

## Lecciones de ejecución registradas

| Fecha | Lección |
|---|---|
| Abr 2026 | **SELL LIMIT por debajo del precio = ejecución inmediata.** Todas las entradas SHORT deben estar POR ENCIMA del precio actual para quedar pendientes. |
| Abr 2026 | **TP en Hedge Mode antes de tener posición → error -2022.** Colocar TPs solo después que entre la primera orden. |
| Abr 2026 | **Trailing Stop SHORT: activar entre el pico y la primera entrada, no en la entrada.** Si se activa en el precio de entrada y el precio sube antes de bajar, el TS cierra sin ganancia (lección ORDI). |
| Abr 2026 | **Si SL o TS activa con entradas pendientes → cancelarlas inmediatamente.** Una entrada que se llena después de cerrar la posición abre nueva exposición no controlada. |
| Abr 2026 | **Verificar siempre Isolated antes de ejecutar.** Cross expone todo el balance. |
| Abr 2026 | **Precision error (-1111): usar cantidades enteras o con mínimos decimales.** Binance rechaza `16.600` — usar `17`. |
| Abr 2026 | **Pump de vela única (PRLUSDT): LIMIT en el rebote nunca se llena.** Vela 4h +54% con 46M vs 1-2M promedio → colapso directo sin rebote. Estrategia: B1 (LIMIT en el pico con RSI >90) o B2 (MARKET en primera vela roja). Las entradas escalonadas por encima esperando rebote = capital inmovilizado, oportunidad perdida. |
| Abr 2026 | **Long rebote válido: RSI 15m ≤ 22 + funding positivo + volumen real.** ORDIUSDT cayó -26% con 1900M vol, RSI 15m tocó 21, funding +0.005%. Señal de entrada: RSI 15m cruza 35 + vela verde con >5M vol. Resultado: +$7.34 en ~30 min. El script monitor-ordi.cjs detectó la señal automáticamente. |
| Abr 2026 | **El script monitor.cjs usa extensión .cjs (no .js).** El proyecto tiene "type":"module" en package.json — los scripts CommonJS deben tener extensión .cjs o Node los rechaza con ReferenceError: require is not defined. |
| Abr 2026 | **Stop Market en UI de Binance: usar "Stop Market" no "Stop Limit".** Stop Limit puede saltear la orden si el precio cae rápido. Stop Market se ejecuta al instante. Campo a llenar: solo "Precio Stop". Luego clic en "Cerrar long/largo". |
