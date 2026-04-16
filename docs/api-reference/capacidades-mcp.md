# Referencia: Capacidades del MCP

Lista completa de herramientas disponibles en este servidor MCP, organizadas por módulo.

---

## Mercado (sin autenticación)

| Tool | Descripción |
|---|---|
| `ping` / `time` | Estado y hora del servidor Binance |
| `exchangeInfo` | Info de todos los pares (límites, filtros, precisión) |
| `tickerPrice` | Precio actual de un par |
| `ticker24hr` | Stats de 24hs (precio, volumen, cambio %) |
| `depth` | Orderbook (bids/asks) |
| `klines` | Velas OHLCV (cualquier timeframe) |
| `aggTrades` | Trades agregados recientes |
| `avgPrice` | Precio promedio últimos 5 min |
| `BinanceOrderBook` | Análisis de orderbook con métricas (custom) |

---

## Spot Trading

| Tool | Descripción |
|---|---|
| `newOrder` | Crear orden (LIMIT, MARKET, STOP_LOSS, etc.) |
| `getOrder` | Consultar estado de una orden |
| `deleteOrder` | Cancelar orden |
| `getOpenOrders` | Órdenes abiertas |
| `deleteOpenOrders` | Cancelar todas las órdenes de un par |
| `allOrders` | Historial completo de órdenes |
| `orderOco` | Crear orden OCO (take profit + stop loss) |

---

## Algo Orders — Futuros USD-M

> ⚠️ **Validado 2026-04-15:** Los endpoints de TWAP, VP y Grid de Futuros **no son públicos**.
> Binance devuelve 404 en todos ellos. Solo funcionan desde la UI web de Binance.
> Las tools del MCP están implementadas pero no pueden ejecutarse.

| Tool | Descripción | Estado real |
|---|---|---|
| `BinanceTimeWeightedAveragePriceNewOrder` | Crear orden TWAP | ❌ Endpoint no público |
| `BinanceVolumeParticipationNewTrade` | Crear orden VP | ❌ Endpoint no público |
| `BinanceCreateFutureGrid` | Crear grid de futuros (Long/Short/Neutral) | ❌ Endpoint no público |
| `cancelAlgoOrder` | Cancelar orden algo activa | ❌ Endpoint no público |
| `currentAlgoOpenOrders` | Ver algo orders abiertas | ✅ Responde (vacío si no hay) |
| `historicalAlgoOrder` | Historial de algo orders | Sin validar |
| `subOrders` | Sub-órdenes generadas por una algo order | Sin validar |

---

## Cuenta

| Tool | Descripción |
|---|---|
| `getAccount` | Balance y permisos de la cuenta spot |
| `myTrades` | Historial de trades ejecutados |
| `rateLimitOrder` | Límites de rate de la cuenta |
| `dailyAccountSnapshot` | Snapshot diario de balance |
| `accountStatus` | Estado general de la cuenta |
| `getApiKeyPermission` | Permisos habilitados en la API key |

---

## Simple Earn

| Tool | Descripción |
|---|---|
| `simpleEarnFlexibleProductList` | Lista de productos disponibles |
| `getFlexibleProductPosition` | Posiciones actuales |
| `subscribeFlexibleProduct` | Suscribirse a un producto |
| `redeemFlexibleProduct` | Retirar de un producto |

---

## Wallet / Activos

| Tool | Descripción |
|---|---|
| `userAsset` | Balance de todos los activos |
| `fundingWallet` | Balance de la wallet de funding |
| `assetDetail` | Detalle de un activo específico |
| `systemStatus` | Estado operacional de Binance |

---

## Diagnóstico (custom)

| Tool | Descripción |
|---|---|
| `BinanceDiagnostic` | Verifica configuración de keys y conectividad |

---

## Plan de validación pendiente — Testnet

Antes de operar con capital real, validar estos tipos de órdenes en la testnet de futuros:
`https://testnet.binancefuture.com`

Pasos:
1. Crear cuenta en testnet.binancefuture.com
2. Generar API keys de testnet
3. Cambiar el endpoint base en el código: `fapi.binance.com` → `testnet.binancefuture.com`
4. Probar cada tipo de orden de la tabla de abajo
5. Documentar resultado antes de usar con capital real

| Tipo de orden | Probado real | Probado testnet | Funciona | Notas |
|---|---|---|---|---|
| LIMIT (entry) | ✅ | ✅ | ✅ | Funciona perfectamente en ambos entornos |
| MARKET (entry) | ❌ | ✅ | ✅ | Validado en testnet, sin razón para fallar en real |
| LIMIT (close/stop manual) | ✅ | — | ⚠️ | Binance limita precio al 5% del mark price — cerró posición accidentalmente |
| STOP_MARKET | ✅ | ✅ | ❌ | Error -4120 en ambos entornos. Binance lo redirige a Algo Order API (no pública) |
| STOP (limit stop) | ✅ | ✅ | ❌ | Error -4120 en ambos entornos |
| TAKE_PROFIT_MARKET | ❌ | ✅ | ❌ | Error -4120 en testnet |
| TAKE_PROFIT | ❌ | ✅ | ❌ | Error -4120 en testnet |
| TRAILING_STOP_MARKET | ❌ | ✅ | ❌ | Error -4120 en testnet |

**Conclusión validada (testnet + real, 2026-04-16) — DEFINITIVA:**

| Endpoint | Tipo | Resultado | Notas |
|---|---|---|---|
| `/fapi/v1/order` | LIMIT | ✅ Funciona | Entradas y cierres planificados |
| `/fapi/v1/order` | MARKET | ✅ Funciona | Entradas y cierres inmediatos |
| `/fapi/v1/order` | STOP_MARKET | ❌ -4120 | Bloqueado por Binance |
| `/fapi/v1/order` | STOP | ❌ -4120 | Bloqueado por Binance |
| `/fapi/v1/order` | TAKE_PROFIT_MARKET | ❌ -4120 | Bloqueado por Binance |
| `/fapi/v1/order` | TAKE_PROFIT | ❌ -4120 | Bloqueado por Binance |
| `/fapi/v1/order` | TRAILING_STOP_MARKET | ❌ -4120 | Bloqueado por Binance |
| `/fapi/v1/order/oco` | OCO | ❌ -5000 | Endpoint no existe en futuros |
| `/fapi/v1/batchOrders` | Batch | ⚠️ HTTP OK pero órdenes internas -4120 | El endpoint existe pero las órdenes condicionales siguen bloqueadas |
| `/fapi/v1/conditional/order` | Condicional | ❌ -5000 | Endpoint no existe |

**Conclusión:** Binance bloquea deliberadamente TODAS las órdenes condicionales en la API pública de futuros.
Solo `LIMIT` y `MARKET` están disponibles. No hay workaround via REST API.

**Estrategia de operación adaptada:**
- Abrir posición con `LIMIT` o `MARKET` ✅
- Colocar orden de cierre con `LIMIT` en el nivel de TP ✅
- Stop loss = orden `LIMIT` de cierre monitoreada manualmente ⚠️
- Cuando Claude detecta precio cerca del stop → cerrar con `MARKET` manual
- Esta modalidad es viable para el estilo consultivo (no autónomo) del sistema

---

## Notas importantes — validadas en sesión real (2026-04-15)

- Las tools de **mercado** no requieren API keys — ideales para análisis previo
- **Órdenes LIMIT/MARKET en futuros funcionan** via `/fapi/v1/order` directamente con axios
- La cuenta tiene **Hedge Mode activo** — todas las órdenes de futuros requieren `positionSide: LONG` o `SHORT`
- El timestamp debe obtenerse del **servidor de Binance** (`/fapi/v1/time`), no del sistema local — hay desfase
- `MIN_NOTIONAL` real de ETHUSDT futuros es **$20 USDT** (no $1,000 — ese límite es solo del validador del MCP)
- Los grids creados desde la UI de Binance **no son visibles via API** ni modificables
- Las tools de algo orders (TWAP, VP, Grid) están implementadas en el MCP pero **sus endpoints no son públicos**
