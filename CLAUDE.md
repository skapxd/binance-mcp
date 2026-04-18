# CLAUDE.md — Cerebro del Sistema de Trading

Este archivo es leído automáticamente al inicio de cada sesión.
Contiene el contexto esencial y los punteros a la documentación detallada.
**Los detalles operativos completos viven en `docs/protocolo-operativo.md`.**

---

## ⚡ INICIO DE SESIÓN — validación automática al arrancar

Al comenzar cada sesión Claude ejecuta en background `BinanceCustomFuturesAccount` y reporta el estado junto con su primera respuesta. No bloquea ni demora la respuesta — informa en paralelo.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ESTADO DE SESIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 ENTORNO: TESTNET — testnet.binancefuture.com
   (o 🔴 PRODUCCIÓN — fapi.binance.com)

💰 Balance: $XXX.XX disponible

🤖 Bots activos (Pilar 1):
   SOLUSDT  ✅ | XRPUSDT  ✅ | ADAUSDT  ✅

⚠️  Alertas: [ninguna / lista de alertas si las hay]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Si hay alertas activas (bot cerca de límite, funding negativo, posición abierta no esperada) → mencionarlas explícitamente aunque el usuario haya preguntado otra cosa.

---

## El equipo

Este proyecto lo desarrollan **dos personas**, ambas desarrolladores y traders activos:

- **Diego** — desarrollador y trader. Trading, estrategias, operaciones con capital real, decisiones finales.
- **Manuel** — desarrollador y trader. Infraestructura backend (AWS Lambda, crons), integraciones, experimenta en trading al igual que Diego.

Cualquiera de los dos puede abrir sesión y agregar pendientes. Claude debe tratar a ambos como pares técnicos.

### Pendientes entre sesiones — cómo funciona

Los pendientes viven en dos archivos según quién los dejó:
- Diego → Manuel: `docs/colaboracion/sync-para-manuel.md`
- Manuel → Diego: `docs/colaboracion/sync-para-diego.md`

**Al inicio de CADA sesión** (junto con el estado de cuenta), Claude revisa ambos archivos buscando ítems `- [ ]` abiertos y los menciona:

```
📋 PENDIENTES DE EQUIPO:
   → Para vos (de Manuel): X ítems abiertos — docs/colaboracion/sync-para-diego.md
   → Para Manuel (de Diego): X ítems abiertos — docs/colaboracion/sync-para-manuel.md
```

Si no hay pendientes → no mencionar. Si hay → mostrar el link siempre, aunque el usuario haya preguntado otra cosa.

---

## El sistema — Dos pilares

### Pilar 1 — Grids conservadores (capital principal)
- **Objetivo:** ingresos estables en mercados laterales
- **Instrumento:** Futuros USD-M, grid neutral, ~60 grids, ~1% entre niveles, 3x leverage, margen aislado, rango 30-40%
- **Criterio de entrada:** mercado lateral confirmado, precio en zona media, sin catalizadores macro
- **Regla clave:** los grids se crean desde la UI de Binance (API no disponible). Claude calcula parámetros y detecta el momento.

### Pilar 2 — Estrategias activas (capital de riesgo ~$100-200)

**A) Shorts en monedas pumpeadas**
- Pumps 100-300%+ sin fundamento | horizonte 1-1.5 días máximo
- Entradas SELL LIMIT escalonadas por encima del precio actual (esperando spike)
- TP fijo + Trailing Stop como salida → ver estructura completa en `docs/protocolo-operativo.md`
- Señales: RSI > 85, volumen cayendo en pico, **funding positivo** (crítico)

**B) Longs en altcoins con momentum**
- Volumen creciendo, RSI saliendo de zona 30-45, MACD girando positivo
- Entradas BUY LIMIT escalonadas por debajo del precio actual (comprando dips)
- Sin TP fijo — Trailing Stop gestiona la salida para capturar el trend completo
- Señales: volumen creciente confirmado, no sobreextensión de funding

---

## Bots activos actualmente

| Par | Estado | Parámetros | Iniciado | Notas |
|---|---|---|---|---|
| SOLUSDT | ✅ Activo | Neutral 3x, rango $68–$110, 60 grids, stop $65, 1,000 USDT | 13 Abr 2026 | $88.61 — 49.1% del rango. Stop +36% lejos. Funding neutro. |
| XRPUSDT | ✅ Activo | Neutral 3x, rango $1.10–$1.75, 60 grids, stop $1.05, 1,000 USDT | 13 Abr 2026 | $1.483 — 58.9% del rango. Techo a -15.3% (~$1.75) — vigilar si supera $1.65. |
| ADAUSDT | ✅ Activo | Neutral 3x geométrico, rango $0.203–$0.325, 60 grids, stop $0.194, 1,000 USDT | 17 Abr 2026 | $0.2581 — 45.2% del rango. Stop +33% lejos. ⚠️ Hard fork Protocol 11 en junio — revisar en mayo. |
| BNBUSDT | ⛔ Cerrado | — | — | Rendimiento inferior. Capital reasignado a XRP y SOL. |

---

## Flujo de trabajo

### Consulta diaria de estado ("¿cómo están los bots?")

```
1. BOTS ACTIVOS
   Por cada bot: precio actual | posición en rango (%) | distancia a límites | PNL estimado

2. ALERTAS TÉCNICAS
   ¿Algún bot está al <15% de un límite? → avisar con acción sugerida
   ¿Funding rate se volvió negativo en alguno? → avisar

3. CONTEXTO FUNDAMENTAL
   Buscar noticias recientes de cada par (WebSearch)
   Eventos clave próximos: regulación, ETFs, upgrades, fechas macro (FOMC, CPI)
   Señal: ¿la noticia confirma lateralización o introduce riesgo de ruptura?

4. VEREDICTO
   ✅ Todo en orden — no hacer nada
   ⚠️ Atención en [par] por [motivo]
   🔴 Acción sugerida: [qué hacer]
```

Tools: `BinanceCustomFuturesBotStatus` por cada bot + `BinanceCustomFuturesAccount` para balance general.

### Consulta de oportunidades ("¿qué encontrás hoy?")

1. `BinanceCustomFuturesAccount` → obtener balance disponible al inicio
2. Script Bash (único caso válido): obtener tickers + `exchangeInfo` para filtrar candidatos por volumen/pump — no hay tool MCP para escaneo masivo
3. Filtrar candidatos (pumpeadas >20% volumen >$5M | laterales ±3% >$10M | momentum alcista)
4. Para cada candidato: `BinanceCustomFuturesAnalyze` → RSI, funding, velas, orderbook en un llamado
5. Reportar con semáforo honesto: ✅ setup claro / ⚠️ señales mixtas / ❌ no operar

**Investigación profunda antes de proponer cualquier trade (OBLIGATORIO):**
- Funding negativo en pump = NO proponer short. Sin excepción. (Lección BIOUSDT: -$40)
- Siempre presentar mínimo 2 opciones + la opción "no operar"
- Si hay señales contradictorias → decirlo explícitamente y no recomendar
- Responder siempre: ¿por qué subió? ¿en qué fase está? ¿el volumen confirma agotamiento?

**Cuando no hay setup inmediato → siempre cerrar con alarmas concretas:**
```
📵 SIN SETUP AHORA — dónde poner alarmas

  Par        Alarma     Condición para entrar cuando suene
  XXXUSDT    $X.XX ↑    RSI >78 + volumen bajo en rebote → SHORT
  YYYUSDT    $X.XX ↓    RSI <30 + 2 velas verdes con volumen → LONG

  → Binance app: Futuros → par → campanita de precio
    Cuando suene: avisame y analizamos si confirma entrada.
```
Siempre dar precio exacto de alarma, no rangos. El usuario la pone en la app y me avisa cuando suena.

**Verificar mínimo notional antes de proponer:** el mínimo de Binance Futures es ~$5 notional por orden. Con $100 a 3x no hay problema en condiciones normales.

→ **Detalle completo de análisis y checklists: `docs/protocolo-operativo.md` Paso 1**

### Protocolo operativo completo
Antes de cualquier ejecución con capital real, seguir el flujo de 5 pasos en `docs/protocolo-operativo.md`:
1. Análisis → 2. Diseño de estrategia (SHORT o LONG — estructuras diferentes) → 3. Testnet → 4. Revisión → 5. Ejecución

---

## Ejecución de órdenes

### Entorno — cómo funciona y cómo detectarlo

El entorno activo se controla desde `.mcp.json` con la variable `BINANCE_ENV`:

| `BINANCE_ENV` | Keys usadas | Endpoint futuros |
|---|---|---|
| `testnet` | `build/.env.testnet` | `testnet.binancefuture.com` |
| `production` (o ausente) | `build/.env` | `fapi.binance.com` |

**Para cambiar de entorno:** editar `.mcp.json` → cambiar el valor de `BINANCE_ENV` → recargar Claude Code.

**Para detectar el entorno activo en sesión:** llamar `BinanceCustomFuturesAccount`. Si el balance es ~$5,000 ficticio → testnet. Si es el balance real → producción.

### Declarar entorno SIEMPRE antes de ejecutar órdenes

```
🔵 ENTORNO: TESTNET — testnet.binancefuture.com
```
```
🔴 ENTORNO: PRODUCCIÓN — fapi.binance.com
⚠️  ALERTA: estamos por ejecutar una orden con dinero real.
    Par: XXXUSDT | Tipo: SELL SHORT LIMIT | Precio: $X.XX | Qty: XX
    Confirmás? (sí / no)
```

La alerta de producción se muestra **siempre**, incluso si el usuario ya confirmó la estrategia.

### Reglas de ejecución

- Siempre mostrar la estructura completa (Claude ejecuta / usuario hace manualmente) antes de ejecutar
- Esperar confirmación explícita del usuario ("ok", "ejecuta", "adelante")
- Nunca ejecutar por iniciativa propia
- La cuenta tiene **Hedge Mode activo** → todas las órdenes requieren `positionSide: LONG` o `SHORT`
- **Testnet = One-way Mode** → NO enviar `positionSide` en testnet
- Usar `BinanceCustomFuturesNewOrder` para órdenes — no scripts Bash
- Pasar `leverage` y `marginType: "ISOLATED"` en la primera orden de cada par
- Colocar TPs **solo después que entre la primera orden** (error -2022 en Hedge Mode si no hay posición)

### Post-ejecución — protecciones automáticas via Algo Order API

Después de confirmar entradas, Claude coloca SL, TP y Trailing Stop **automáticamente** via `BinanceCustomFuturesAlgoOrder`. No se necesita ir a la UI de Binance.

```
✅ Claude ejecuta automáticamente (en orden):
  ① Entradas LIMIT escalonadas  → BinanceCustomFuturesNewOrder
  ② Stop Loss                   → BinanceCustomFuturesAlgoOrder (STOP_MARKET, closePosition: true)
  ③ Take Profit (si aplica)     → BinanceCustomFuturesAlgoOrder (TAKE_PROFIT_MARKET, closePosition: true)
  ④ Trailing Stop               → BinanceCustomFuturesAlgoOrder (TRAILING_STOP_MARKET, closePosition: true)

Parámetros clave:
  SHORT → SL por encima del pico | TP en zona de soporte | TS activación 3-5% bajo pico, callback 6%
  LONG  → SL bajo mínimo de entrada | TS activación 5% sobre entrada en ganancia, callback 6%

⚠️ Colocar SL/TP solo DESPUÉS que entre la primera orden (error -2022 si no hay posición).
⚠️ En producción (Hedge Mode): positionSide LONG o SHORT obligatorio en todas las órdenes algo.
```

→ **Estructura completa SHORT y LONG con ejemplos: `docs/protocolo-operativo.md` Paso 2**

---

## Capacidades técnicas — Via MCP (usar SIEMPRE, nunca scripts Bash)

| Cuándo usarla | Tool | Descripción |
|---|---|---|
| Analizar símbolo Pilar 2 | `BinanceCustomFuturesAnalyze` | Precio, RSI 1h, funding (2 fuentes + semáforo), velas 4h/15m, orderbook, pump %. Un llamado reemplaza todos los scripts de análisis. |
| Estado de cuenta | `BinanceCustomFuturesAccount` | Balance USDT disponible, posiciones abiertas, órdenes abiertas. Usar al inicio de sesión y antes de operar. |
| Chequeo diario bots Pilar 1 | `BinanceCustomFuturesBotStatus` | Precio, % en rango, distancia a stop/techo, funding, alertas automáticas. Pasar symbol + rangeMin + rangeMax + stopLoss. |
| Colocar órdenes | `BinanceCustomFuturesNewOrder` | LIMIT/MARKET con leverage y margin. Siempre positionSide SHORT/LONG en producción. |
| Analizar candidatos grid | `BinanceCustomGridCandidateAnalyzer` | ATR, Kaufman ER, backtest 1m. Complementar con funding manual. |
| TP, SL, Trailing Stop | `BinanceCustomFuturesAlgoOrder` | Órdenes condicionales via Algo Order API. Usa `triggerPrice` (no `stopPrice`). |
| Consultar TP/SL activos | `BinanceCustomFuturesAlgoOpenOrders` | Ver todas las órdenes condicionales abiertas de un símbolo. |
| Cancelar TP/SL | `BinanceCustomFuturesCancelAlgoOrder` | Cancelar por `algoId`. Obtener el ID con AlgoOpenOrders. |

**Regla:** nunca usar scripts Bash node para consultas que ya tienen tool MCP. Los scripts solo como último recurso si una tool falla.

→ **Referencia completa: `docs/api-reference/capacidades-mcp.md`**

---

## Reglas del sistema

0. **Órdenes condicionales via Algo Order API** — STOP_MARKET, TAKE_PROFIT_MARKET, TRAILING_STOP van por `BinanceCustomFuturesAlgoOrder` (endpoint `/fapi/v1/algoOrder`). Usar `triggerPrice` en vez de `stopPrice`. El endpoint clásico `/fapi/v1/order` da error -4120 para estos tipos.
1. **Nunca ejecutar sin confirmación explícita del usuario**
2. **Análisis antes que ejecución** — siempre RSI, MACD, funding y ATR antes de proponer
3. **Documentar todo** — cada estrategia, aprendizaje y cambio va a `docs/`
4. **Watchlist viva** — actualizar `docs/mercado/watchlist.md` en cada sesión con cambios relevantes
5. **Capital conservador** — Pilar 1 es la base; Pilar 2 es oportunista con capital limitado
6. **Stop en grids** — no usar stop automático; cerrar con orden límite cuando el precio aún está en rango

---

## Estructura de documentación

```
/
├── CLAUDE.md                              ← Este archivo — contexto y reglas esenciales
├── docs/
│   ├── protocolo-operativo.md             ← Flujo completo, estructuras SHORT/LONG, checklists
│   ├── mercado/
│   │   └── watchlist.md                   ← Monedas en seguimiento activo
│   ├── estrategias/
│   │   ├── estrategias-limit-orders.md
│   │   ├── grid-futuros-conservador.md
│   │   └── ...
│   └── api-reference/
│       └── capacidades-mcp.md             ← Qué funciona y qué no en la API
```
