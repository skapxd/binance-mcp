# Estrategia Actual: Grid de Futuros Conservador

## Descripción general

Estrategia de grid trading en Futuros USD-M de Binance con parámetros amplios y conservadores,
diseñada para capturar ganancias en mercados laterales con riesgo controlado.

## Parámetros actuales

| Parámetro | Valor |
|---|---|
| Tipo de grid | Neutral (GRID_NEUTRAL) |
| Rango | ~60% del precio de referencia |
| Número de grids | 60 |
| Apalancamiento | 3x |
| Objetivo | Mercados laterales |

**Ejemplo con BTC a $80,000:**
- Precio inferior: ~$56,000 (−30%)
- Precio superior: ~$104,000 (+30%)
- Espaciado entre grids: ~$800 por nivel

## Por qué funciona esta configuración

- **Rango amplio (60%)**: reduce el riesgo de que el precio salga del rango, incluso en movimientos fuertes
- **60 grids**: suficientes para capturar múltiples oscilaciones sin ser demasiado denso
- **3x apalancamiento**: amplifica ganancias sin exposición excesiva a liquidación
- **Neutral**: gana tanto en rebotes hacia arriba como hacia abajo dentro del rango

## Limitaciones conocidas

- En tendencias fuertes (breakout del rango), el grid pierde eficiencia
- Los grids creados desde la UI de Binance **no son visibles via API** — solo desde la web/app
- El rendimiento diario es bajo pero consistente; no es una estrategia de alto retorno

## Oportunidades de mejora identificadas

### 1. Detección de lateralización via API
Antes de abrir un grid, Claude podría analizar:
- Volatilidad reciente (ATR de klines)
- Funding rate (mercado lateral = funding cerca de 0)
- Volumen relativo (bajo volumen sugiere lateral)

### 2. Ajuste dinámico de rango
En lugar de siempre usar 60%, calcular el rango óptimo basado en volatilidad histórica del activo.

### 3. Apertura de grids via API (ver `ordenes-algo-twap-vp.md`)
El MCP tiene implementado `BinanceCreateFutureGrid` que permite crear grids programáticamente
con los mismos parámetros que usás manualmente.

## Registro de configuraciones

> Ir documentando acá cada grid abierto con fecha, par, parámetros y resultado.

| Fecha | Par | Rango | Grids | Leverage | Estado | Resultado |
|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - |
