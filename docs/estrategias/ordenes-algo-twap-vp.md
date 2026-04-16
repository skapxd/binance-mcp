# Órdenes Algorítmicas: TWAP y Volume Participation (VP)

> ⚠️ **Validado 2026-04-15:** Los endpoints de TWAP, VP y Grid de **Futuros** devuelven 404.
> No son públicos. Binance los reserva para su UI.
> El **TWAP de Spot** (`/sapi/v1/algo/spot/newOrderTwap`) sí está disponible via API.


Estas son las dos órdenes "inteligentes" disponibles en Futuros USD-M de Binance via API.
Son herramientas poderosas para entrar o salir de posiciones grandes sin impactar el mercado.

---

## 1. TWAP — Time-Weighted Average Price

### Qué hace
Divide una orden grande en muchas órdenes pequeñas ejecutadas de forma **uniforme a lo largo del tiempo**.
El objetivo es que el precio de entrada promedio se aproxime al precio promedio del período.

### Parámetros clave
| Parámetro | Descripción | Límites |
|---|---|---|
| `symbol` | Par (ej: BTCUSDT) | — |
| `side` | BUY o SELL | — |
| `quantity` | Monto en USDT | 1,000 – 1,000,000 |
| `duration` | Duración en segundos | 300s (5min) – 86,400s (24hs) |
| `limitPrice` | Precio máximo/mínimo aceptado | Opcional |

### Cuándo usarlo
- Querés entrar a una posición grande **sin mover el precio**
- El mercado está en tendencia suave y querés un precio promedio razonable
- Querés acumular posición durante horas sin estar mirando la pantalla

### Ejemplo de uso con Claude
> "Entrá largo en BTCUSDT por $5,000 USDT distribuido en las próximas 2 horas"
→ Claude ejecuta TWAP con `quantity=5000`, `duration=7200`, `side=BUY`

---

## 2. VP — Volume Participation

### Qué hace
Ejecuta órdenes **siguiendo el volumen del mercado**. En momentos de alto volumen ejecuta más,
en momentos de bajo volumen ejecuta menos. El objetivo es no ser detectado ni impactar el precio.

### Parámetros clave
| Parámetro | Descripción | Opciones |
|---|---|---|
| `symbol` | Par (ej: BTCUSDT) | — |
| `side` | BUY o SELL | — |
| `quantity` | Monto en USDT | 10,000 – 1,000,000 |
| `urgency` | Velocidad de ejecución | LOW / MEDIUM / HIGH |
| `limitPrice` | Precio límite | Opcional |

### Cuándo usarlo
- Querés entrar a una posición mediana-grande **siguiendo el flujo del mercado**
- No te urge el tiempo pero sí el precio promedio
- `urgency=LOW` = paciente, mejor precio | `urgency=HIGH` = rápido, peor precio

### Diferencia clave con TWAP
- **TWAP**: ignora el volumen, ejecuta en tiempo fijo uniforme
- **VP**: se adapta al volumen del mercado, puede ejecutar más rápido en picos de volumen

---

## 3. BinanceCreateFutureGrid (Grid via API)

### Qué hace
Crea un **grid de futuros programáticamente**, equivalente a lo que hacés manualmente en la UI.

### Parámetros clave
| Parámetro | Descripción | Opciones |
|---|---|---|
| `symbol` | Par (ej: BTCUSDT) | — |
| `strategyType` | Dirección del grid | GRID_LONG / GRID_SHORT / GRID_NEUTRAL |
| `lowerPrice` | Precio inferior del rango | — |
| `upperPrice` | Precio superior del rango | — |
| `gridNum` | Cantidad de grids | 2 – 170 |
| `initialMargin` | Margen inicial en USDT | — |
| `leverage` | Apalancamiento | 1x en adelante |
| `gridMode` | Espaciado | ARITHMETIC / GEOMETRIC |

### ARITHMETIC vs GEOMETRIC
- **ARITHMETIC**: espaciado uniforme en $ entre niveles. Mejor para rangos no muy amplios.
- **GEOMETRIC**: espaciado proporcional en %. Mejor para rangos amplios (como el tuyo de 60%).

> Para tu estrategia actual de 60% de rango, **GEOMETRIC es más adecuado** porque
> el espacio entre grids se adapta al nivel de precio.

---

## Combinaciones estratégicas posibles

### A. "Grid + TWAP para ajuste de posición"
1. Grid neutral abierto en rango amplio (estrategia actual)
2. Si el precio rompe hacia un lado → usar TWAP para cerrar gradualmente el grid perdedor
3. Reubicar el grid en el nuevo rango

### B. "VP para acumular antes de abrir un grid"
1. Detectar zona de soporte fuerte via análisis de klines/orderbook
2. Usar VP para acumular posición en esa zona
3. Abrir un grid encima de esa zona como "seguro"

### C. "Apertura automática de grid cuando el mercado lateraliza"
1. Claude monitorea funding rate + volatilidad
2. Cuando ATR baja y funding se normaliza → señal de lateral
3. Claude abre grid automáticamente con parámetros calculados
