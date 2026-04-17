# Referencia: Capacidades del MCP

> Última actualización: 2026-04-16
> Validado en testnet con SDK `@binance/derivatives-trading-usds-futures`

---

## Herramientas de Futuros USDⓈ-M — CUSTOM (las que usamos)

Estas dos tools fueron agregadas específicamente para este sistema de trading.
Usan el SDK oficial `@binance/derivatives-trading-usds-futures` que apunta a `fapi.binance.com`.

### `BinanceCustomFuturesNewOrder` — Colocar órdenes en Futuros

La herramienta principal de ejecución. Reemplaza los scripts Bash manuales.

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `symbol` | string | ✅ | Par, ej. `SOLUSDT` |
| `side` | BUY \| SELL | ✅ | Dirección de la orden |
| `type` | MARKET \| LIMIT \| ... | ✅ | Tipo de orden (ver tabla de soporte abajo) |
| `quantity` | number | ✅ | Cantidad en base asset. Si conocés USDT: `qty = usdt / precio` |
| `positionSide` | LONG \| SHORT \| BOTH | ⚠️ | **Obligatorio si la cuenta está en Hedge Mode** (la cuenta real sí lo está). LONG para posiciones long, SHORT para shorts. Omitir solo en One-way Mode (testnet). |
| `price` | number | Para LIMIT | Precio límite |
| `timeInForce` | GTC \| IOC \| FOK \| GTX | Opcional | Default GTC para LIMIT. GTX = post-only (maker) |
| `leverage` | 1-125 | Opcional | Si se pasa, setea el leverage antes de la orden |
| `marginType` | ISOLATED \| CROSSED | Opcional | Si se pasa, cambia el tipo de margen antes de la orden. Falla silenciosamente si ya estaba seteado (-4046). |
| `reduceOnly` | boolean | Opcional | Solo reduce posición existente. **No usar junto con `positionSide`** en Hedge Mode — son incompatibles. |
| `newClientOrderId` | string | Opcional | ID propio para tracking |

**Tipos de orden soportados (validado testnet 2026-04-16):**

| Tipo | Estado | Cómo usarlo |
|---|---|---|
| `LIMIT` | ✅ Funciona | Entradas escalonadas, Take Profit. Precio debe estar sobre el mercado para SELL SHORT que espera spike. |
| `MARKET` | ✅ Funciona | Cierre de emergencia, entrada inmediata |
| `STOP_MARKET` | ❌ Bloqueado | "Order type not supported — use Algo Order API" — colocar desde UI de Binance |
| `TAKE_PROFIT_MARKET` | ❌ Bloqueado | Ídem — UI de Binance |
| `TRAILING_STOP_MARKET` | ❌ Bloqueado | Ídem — UI de Binance |

> **Workaround para Stop Loss:** colocar desde UI de Binance → Futures → posición → Add SL/TP.
> Claude monitorea el precio y avisa cuando acercarse al stop → el usuario cierra con MARKET si es necesario.

**Capacidades adicionales que hace antes de la orden (en el mismo llamado):**
- Setea leverage: `leverage: 3`
- Setea margen a Isolated: `marginType: "ISOLATED"`
- Ambas pueden combinarse con la orden en un solo llamado

---

### `BinanceCustomFuturesAnalyze` — Análisis completo de símbolo

Reemplaza los scripts node manuales de análisis. Un solo llamado devuelve todo lo necesario para evaluar una oportunidad Pilar 2.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `symbol` | string | Par a analizar, ej. `ORDIUSDT` |

**Qué devuelve:** precio, cambio 24h, pump desde mínimos, distancia del pico, RSI 1h, funding (último + historial 4 períodos + interpretación del semáforo), orderbook bid/ask ratio, tendencia de volumen 4h, velas 4h (últimas 5) y 15m (últimas 6).

---

### `BinanceCustomFuturesAccount` — Estado de la cuenta

Estado completo de la cuenta en un llamado. Sin parámetros.

**Qué devuelve:** balance USDT disponible y total, PnL abierto, todas las posiciones abiertas (símbolo, dirección, tamaño, entrada, mark price, PnL, ROI%, precio de liquidación), todas las órdenes abiertas.

---

### `BinanceCustomFuturesBotStatus` — Estado de bot grid (Pilar 1)

Para el chequeo diario de bots activos.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `symbol` | string | Par del bot, ej. `SOLUSDT` |
| `rangeMin` | number | Límite inferior del rango |
| `rangeMax` | number | Límite superior del rango |
| `stopLoss` | number | Precio de stop loss |

**Qué devuelve:** precio actual, % en rango, distancia al stop/techo/piso, funding, y alertas automáticas si el precio está al <15% de un límite o si el funding se volvió negativo.

---

### `BinanceCustomGridCandidateAnalyzer` — Análisis de candidatos para grids

Automatiza el análisis que antes se hacía manualmente con scripts.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `symbol` | string (opcional) | Si se pasa, analiza ese par específico. Si no, escanea los top N pares USDT. |
| `topN` | number | Cuántos pares escanear (default 20) |
| `capital` | number | Capital a asignar al grid |
| `leverage` | number | Leverage a simular |

**Qué calcula internamente:**
- ATR (volatilidad promedio)
- Kaufman Efficiency Ratio (lateralización vs tendencia)
- Correlación con BTC
- Spread del orderbook
- Rango óptimo sugerido (basado en ATR 30d)
- Profit por grid neto de fees
- Backtest realista sobre klines 1m con breakdown por ventana temporal

> ⚠️ **Nota:** este analizador usa klines del spot (`api.binance.com`), no de futuros (`fapi.binance.com`).
> Para análisis de futuros el precio es prácticamente igual, pero el funding rate y el volumen de futuros
> no están incluidos. Complementar con consulta manual de funding antes de confirmar la estrategia.

---

## Qué puede hacer el SDK de Futuros — tabla completa (validado testnet 2026-04-16)

Estas capacidades están disponibles via `usdsFuturesClient` en el MCP.
Las marcadas ✅ pueden agregarse como nuevas tools si se necesitan.

| Capacidad | SDK method | Estado | Uso en nuestro sistema |
|---|---|---|---|
| Colocar LIMIT | `newOrder` | ✅ | BinanceCustomFuturesNewOrder (ya disponible) |
| Colocar MARKET | `newOrder` | ✅ | BinanceCustomFuturesNewOrder (ya disponible) |
| Cancelar orden | `cancelOrder` | ✅ | BinanceCustomFuturesNewOrder podría extenderse |
| Cancelar todas | `cancelAllOpenOrders` | ✅ | No expuesto en MCP aún |
| Modificar orden | `modifyOrder` | ✅ | No expuesto en MCP aún |
| Ver órdenes abiertas | `currentAllOpenOrders` | ✅ | Se hace via script |
| Historial de órdenes | `allOrders` | ✅ | Se hace via script |
| Balance USDT | `futuresAccountBalanceV2` | ✅ | Se hace via script |
| Posición abierta | `positionInformationV2` | ✅ | Se hace via script |
| Mark price + funding | `markPrice` | ✅ | Se hace via script |
| Historial funding | `getFundingRateHistory` | ✅ | Se hace via script |
| Klines (velas) | `klineCandlestickData` | ✅ | Se hace via script |
| Ticker 24h | `ticker24hrPriceChangeStatistics` | ✅ | Se hace via script |
| Orderbook | `orderBook` | ✅ | Se hace via script |
| Exchange info (filtros/status) | `exchangeInformation` | ✅ | Se hace via script |
| Setear leverage | `changeInitialLeverage` | ✅ | Dentro de BinanceCustomFuturesNewOrder |
| Setear margen | `changeMarginType` | ✅ | Dentro de BinanceCustomFuturesNewOrder |
| Ver modo posición | `getCurrentPositionMode` | ✅ | Se hace via script |
| STOP_MARKET | `newOrder` | ❌ | Bloqueado por Binance (API pública) |
| TAKE_PROFIT_MARKET | `newOrder` | ❌ | Bloqueado por Binance |
| TRAILING_STOP_MARKET | `newOrder` | ❌ | Bloqueado por Binance |
| Grid bots | — | ❌ | Solo desde UI de Binance |

---

## Modelo híbrido de trabajo

### Qué hace Claude via MCP/SDK

```
BinanceCustomFuturesNewOrder → entradas LIMIT escalonadas
BinanceCustomFuturesNewOrder → Take Profit LIMIT
BinanceCustomFuturesNewOrder → cierre MARKET de emergencia
BinanceCustomGridCandidateAnalyzer → análisis de candidatos para grids
scripts (Bash) → consulta de precios, RSI, funding, orderbook, balance
```

### Qué hace el usuario manualmente desde UI de Binance

```
Stop Loss        → Futures → posición → Add SL/TP
Trailing Stop    → Futures → posición → Trailing Stop
Grid bots        → Futures → Bot Trading → Grid
```

---

## Testnet vs Producción

| Aspecto | Testnet | Producción |
|---|---|---|
| URL | `testnet.binancefuture.com` | `fapi.binance.com` |
| Hedge Mode | ❌ One-way (`dualSidePosition: false`) | ✅ Activo (`positionSide` requerido) |
| `positionSide` en órdenes | No enviar (error si se envía) | Obligatorio: `LONG` o `SHORT` |
| `reduceOnly` | Puede usarse | No usar junto con `positionSide` |
| Keys | `build/.env.testnet` | `build/.env` |
| Saldo USDT | ~$5,000 (ficticio) | Real |
| Activar | `BINANCE_ENV=testnet` en `.mcp.json` | `BINANCE_ENV=production` (o eliminar la variable) |

**Cómo cambiar de entorno:** editar `.mcp.json` → modificar `BINANCE_ENV` → recargar Claude Code.
**Cómo detectar el entorno activo:** llamar `BinanceCustomFuturesAccount`. Balance ~$5,000 = testnet. Balance real = producción.

**Regla de trabajo:** siempre probar en testnet primero cuando se cambia la estructura de una estrategia.
Para tipos de orden ya validados (LIMIT/MARKET), no hace falta re-validar en cada operación.

---

## Herramientas de Spot — para referencia

> Estas tools existen en el MCP pero no se usan para futuros. Se listan para completitud.

### Mercado Spot (sin autenticación)

| Tool | Descripción |
|---|---|
| `BinanceKlines` | Velas OHLCV — **útil para análisis histórico** (usa api.binance.com) |
| `BinanceTicker24hr` | Stats 24h de spot |
| `BinanceTickerPrice` | Precio spot actual |
| `BinanceOrderBook` | Orderbook spot con métricas |
| `BinanceDepth` | Orderbook raw |
| `BinanceAggTrades` | Trades recientes |

### Spot Trading (autenticado)

| Tool | Descripción |
|---|---|
| `BinanceNewOrder` | Crear orden spot |
| `BinanceCancelOrder` | Cancelar orden spot |
| `BinanceGetOpenOrders` | Órdenes spot abiertas |
| `BinanceAllOrders` | Historial spot |
| `BinanceOrderOco` | OCO spot (sí funciona en spot, no en futuros) |

### Algo Orders (no públicos)

> Implementados en el MCP pero los endpoints de Binance no son públicos → no funcionan.

| Tool | Estado |
|---|---|
| `BinanceTimeWeightedAveragePriceNewOrder` | ❌ 404 |
| `BinanceCreateFutureGrid` | ❌ 404 |
| `cancelAlgoOrder` | ❌ 404 |

---

## Diagnóstico

| Tool | Descripción |
|---|---|
| `BinanceDiagnostic` | Verifica API keys y conectividad básica |
| `BinanceTotalEstimatedValue` | Valor total estimado de la cuenta spot |
