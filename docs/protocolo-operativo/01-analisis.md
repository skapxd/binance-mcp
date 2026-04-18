# Paso 1 — Análisis de Mercado

**Cuándo:** cuando el usuario pide un escaneo o quiere evaluar un símbolo.

---

## 1a — Contexto macro PRIMERO (obligatorio antes de analizar cualquier moneda)

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

## 1b — Análisis de candidatos individuales

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
   - Funding rate: **siempre DOS fuentes** (ver [02-funding.md](02-funding.md))
   - Orderbook ratio bid/ask
   - Klines 4h últimas 6 velas + klines 15m últimas 8 velas
   - Volumen por vela: ¿cayendo (agotamiento) o subiendo (momentum activo)?
   - **Correlación con BTC en ese momento:** si BTC bajó mientras la altcoin subió → pump desacoplado (más fuerte/más riesgoso). Si subieron juntos → pump dependiente del mercado general.

---

## 1c — Análisis de moneda específica

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

---

## Output del escaneo general

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

✅ SETUP VÁLIDO — propongo 2 estrategias:
  WWWUSDT +90% — funding ✅ +0.19%, volumen cayó 70%, confirmación bajista activa
  [A] Conservadora: ...
  [B] Agresiva: ...
```

Claude NO elige por el usuario. Si no hay setup → decirlo y cerrar con alarmas concretas:

```
📵 SIN SETUP AHORA — qué vigilar

  Par           Alarma        Condición para entrar
  XXXUSDT       $X.XX ↑       RSI >78 en ese precio + volumen bajo
  YYYUSDT       $X.XX ↓       RSI <30 + 2 velas 15m verdes con volumen

  → Poné estas alarmas en la app de Binance (Futuros → par → campanita)
    Cuando suene: avisame y analizamos en el momento si confirma entrada.
```

---

## Temporalidades — siempre especificar en cada dato

| Dato | Temporalidad usada | Por qué |
|---|---|---|
| RSI | **1h** | Captura el momentum relevante sin ruido de 1m |
| Velas de análisis | **4h** | Para leer la fase del pump (Tipo A/B, agotamiento, estructura macro) |
| Velas de entrada | **15m** | Para confirmar reversión antes de ejecutar |
| Volumen de confirmación | **15m** | Comparar las últimas 4-6 velas 15m para detectar spike o caída |

Ejemplo correcto: *"RSI 1h <45 + 2 velas 15m verdes con volumen creciente → long rebote"*

---

## Unidades de volumen — Claude vs UI de Binance

Claude reporta volumen en **USDT** (quoteVolume). La UI de Binance muestra volumen en **cantidad de la moneda base**.

Conversión: `volumen en moneda = volumen USDT / precio actual`

Ejemplo con PIPPIN a $0.0425:
- Claude dice: "vela 2.76M" → en tu gráfico ves ~65M PIPPIN
- Claude dice: "≥1.5M USDT" → en tu gráfico es ≥35M PIPPIN

**Cuando Claude da umbrales de volumen para señales, siempre incluye el equivalente en coins.**

---

## Checklist de VETO para shorts en pumps

**Paso 0 — Capital:**
- Consultar `availableBalance` en `/fapi/v2/balance`
- Si capital < $20 → no hay trade posible
- Verificar mínimo UI: `qty_min_UI = 1000 / precio_actual`. Si capital × 3 < qty_min_UI → trade inviable

**Pasos 1-5 — Solo si el capital es suficiente:**

| Condición | Señal requerida | Por qué |
|---|---|---|
| Funding rate | Positivo como señal base — ver regla contextual en [02-funding.md](02-funding.md) | Negativo = mercado ya está short = riesgo de squeeze |
| Volumen en el pico | **Debe estar cayendo** vs velas anteriores | Si el volumen sigue alto, el pump no terminó |
| RSI 1h | > 85 **y cayendo**, o con divergencia bajista | RSI alto solo no alcanza si el momentum sigue |
| MACD 1h | Girando o cruzando a la baja | MACD positivo creciente = pump activo |
| Distancia desde mínimos | Pump ≥ 100% desde el inicio | Pumps menores tienen más probabilidad de continuar |

→ Ver regla de funding completa: [02-funding.md](02-funding.md)

---

## Fases del pump — leer en velas 4h antes de entrar short

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

---

## Confirmación bajista — cuándo se puede entrar short

No entrar solo porque el precio baja un poco. Confirmación requiere **al menos 2 de estos 3**:
1. **2 velas 15m consecutivas en rojo** con cierre por debajo de la apertura anterior
2. **Volumen en las velas rojas ≥ volumen promedio** de las últimas 4 velas
3. **Precio rompe un soporte claro** — mínimo de la última hora o zona de consolidación previa

Una sola vela roja no es confirmación.

**Señal adicional: mecha larga en el pico (lección ENAUSDT — abr 2026)**
Si el pico de la vela muestra una mecha larga → liquidación de longs confirmada. Es la señal más clara de agotamiento. En ese caso el Camino B2 (MARKET en la primera vela roja) es más efectivo que esperar LIMIT en el rebote — el rebote generalmente no llega al precio de la mecha.

→ Ver lecciones relacionadas: [lecciones.md#analisis-de-entrada](lecciones.md#analisis-de-entrada)

---

## Checklist de ENTRADA para longs con momentum

| Condición | Señal requerida |
|---|---|
| RSI 1h | Saliendo de zona 30-45, cruzando al alza |
| MACD 1h | Cruzando la señal hacia arriba o girando positivo |
| Volumen | Creciendo vs las últimas 4-6 velas — acumulación activa |
| Funding | Neutro o ligeramente positivo (no sobreextendido) |
| Contexto | Coin pequeña, sin posición dominante de mercado — más explosividad potencial |

NO entrar long si el volumen no confirma. Muchos "cruces de RSI" son falsas señales sin volumen.
