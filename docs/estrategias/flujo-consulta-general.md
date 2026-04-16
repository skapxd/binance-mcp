# Flujo de Consulta General: Análisis de Mercado con Claude + MCP

## Concepto

Claude tiene acceso directo a datos reales de Binance via MCP.
Esto permite un flujo de trabajo donde el usuario pide análisis de un símbolo
y Claude responde con propuestas de estrategia contextualizadas al momento del mercado.

No es automatización — es un **co-piloto de trading** que analiza, propone y ejecuta
cuando el usuario lo confirma.

---

## Flujo de consulta estándar

```
Usuario: "Analiza ETHUSDT y dime qué estrategia ves"
           ↓
Claude consulta (en paralelo):
  - Precio actual
  - Ticker 24hs (cambio %, volumen, high/low)
  - Klines 4h últimas 30 velas → ATR, rango, tendencia
  - Klines 1d últimos 14 días → contexto macro
  - Funding rate últimas 8 lecturas → presión direccional
  - Orderbook top 20 → presión compradora vs vendedora
           ↓
Claude clasifica el mercado:
  - LATERAL → estrategias de rango (grid, TWAP acumulación)
  - TENDENCIA ALCISTA → estrategias long direccionales
  - TENDENCIA BAJISTA → estrategias short o defensivas
  - POST-SPIKE / DIGESTIÓN → cautela, esperar confirmación
           ↓
Claude propone 2-3 estrategias con:
  - Tipo de estrategia y por qué aplica ahora
  - Parámetros concretos (rango, niveles, margen sugerido)
  - Nivel de riesgo estimado
  - Qué invalida la estrategia (cuándo saldría)
           ↓
Usuario elige → Claude ejecuta con confirmación previa
```

---

## Indicadores que Claude analiza

| Indicador | Qué nos dice | Señal lateral | Señal tendencia |
|---|---|---|---|
| ATR 4h | Volatilidad reciente | ATR bajo y estable | ATR creciente |
| Funding rate | Presión del mercado | Cerca de 0% | Alto positivo (longs) o negativo (shorts) |
| Rango 14d vs rango 24h | Compresión de precio | Rango 24h << rango 14d | Rango 24h similar al 14d |
| Cambio % 24h | Momentum | < 1% | > 3% sostenido |
| Ratio bid/ask orderbook | Presión inmediata | ~1.0 | < 0.5 o > 2.0 |
| Posición del precio en rango 14d | Contexto | Mitad del rango | Cerca de extremos |

---

## Tipos de estrategia que Claude puede proponer

### 1. Grid neutral (mercado lateral)
- Ideal cuando: ATR estable, funding ~0, precio en medio del rango
- Herramienta: `BinanceCreateFutureGrid` (si disponible) o límit orders manuales
- Riesgo: bajo-medio

### 2. LIMIT orders escalonadas + sells (grid manual)
- Ideal cuando: mercado lateral con ligera tendencia o post-corrección
- Herramienta: órdenes `LIMIT` en futuros via `/fapi/v1/order` ✅ confirmado funcional
- Ver detalle en: `estrategias/twap-acumulacion-grid.md`
- Nota: TWAP de futuros no disponible via API — se reemplaza con LIMIT orders
- Riesgo: medio

### 3. TWAP direccional (tendencia)
- Ideal cuando: tendencia clara, queremos entrar sin impactar precio
- Herramienta: `BinanceTimeWeightedAveragePriceNewOrder`
- Riesgo: medio-alto (depende de la tendencia)

### 4. VP acumulación (entrada institucional)
- Ideal cuando: volumen alto, queremos entrar grande siguiendo el flujo
- Herramienta: `BinanceVolumeParticipationNewTrade`
- Mínimo: $10,000 USDT
- Riesgo: medio

### 5. Grid estático con límit orders (grid manual una pasada)
- Ideal cuando: lateral confirmado, presupuesto pequeño
- Herramienta: `newOrder` repetido en N niveles
- Riesgo: bajo

---

## Protocolo de riesgo

Antes de cualquier ejecución Claude debe informar:
- **Dónde se invalida la estrategia** (precio de salida/stop)
- **Máxima pérdida estimada** con los parámetros propuestos
- **Qué porcentaje del capital disponible** representa la operación

El usuario siempre confirma antes de ejecutar.

---

## Registro de consultas

> Ir documentando acá cada análisis realizado para trackear aciertos y errores.

| Fecha | Símbolo | Clasificación | Estrategia propuesta | Ejecutado | Resultado |
|---|---|---|---|---|---|
| 2026-04-15 | ETHUSDT | Lateral post-spike | LIMIT orders escalonadas + sells | Prueba técnica OK | — |
