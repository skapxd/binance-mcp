# Estrategias con Órdenes Disponibles en Futuros

> Documento vivo — se actualiza con cada iteración y feedback real.
> Creado: 2026-04-15 | Validado en sesión real con cuenta live.

---

## Tipos de órdenes confirmados (ETHUSDT Futuros)

Validado via `/fapi/v1/exchangeInfo` el 2026-04-15:

| Tipo | Descripción | Uso principal |
|---|---|---|
| `LIMIT` | Ejecuta en precio exacto si el mercado llega | Entradas y salidas planificadas |
| `MARKET` | Ejecuta al precio actual inmediatamente | Entradas en breakout, cierres urgentes |
| `STOP` | Limit que se activa cuando el precio toca un nivel (a la baja) | Stop con slippage controlado |
| `STOP_MARKET` | Market que se activa cuando el precio toca un nivel | Stop clásico, sale sí o sí |
| `TAKE_PROFIT` | Limit que se activa cuando el precio sube a un nivel | TP con precio exacto garantizado |
| `TAKE_PROFIT_MARKET` | Market que se activa al alza | TP rápido, sin garantía de precio exacto |
| `TRAILING_STOP_MARKET` | Sigue el precio con distancia fija, se activa si revierte | Dejar correr ganancias con protección |

**Time in force disponibles:** GTC (hasta cancelar), IOC, FOK, GTX, GTD

**Nota Hedge Mode:** la cuenta tiene Hedge Mode activo.
Todas las órdenes requieren `positionSide: LONG` o `SHORT` explícito.

---

## Estrategia 1 — Grid Manual Clásico con Stop Global

### Concepto
Replica la lógica de los grids nativos de Binance usando órdenes LIMIT.
Se colocan compras debajo del precio y ventas arriba. Cuando se ejecuta
una compra, se coloca la venta correspondiente encima, y viceversa.
Un STOP_MARKET global protege si el precio rompe el rango.

### Estructura
```
SELL LIMIT  @ nivel+4
SELL LIMIT  @ nivel+3
SELL LIMIT  @ nivel+2
SELL LIMIT  @ nivel+1
─────── precio actual ───────
BUY LIMIT   @ nivel-1
BUY LIMIT   @ nivel-2
BUY LIMIT   @ nivel-3
BUY LIMIT   @ nivel-4
─────────────────────────────
STOP_MARKET @ piso duro (cierra todo)
```

### Ejemplo con ETH @ $2,379
```
SELL LIMIT  @ $2,500  (+5.1%)
SELL LIMIT  @ $2,460  (+3.4%)
SELL LIMIT  @ $2,420  (+1.7%)
SELL LIMIT  @ $2,390  (+0.5%)
─────── $2,379 ───────
BUY LIMIT   @ $2,300  (−3.3%)
BUY LIMIT   @ $2,260  (−5.0%)
BUY LIMIT   @ $2,220  (−6.7%)
BUY LIMIT   @ $2,180  (−8.4%)
─────────────────────────────
STOP_MARKET @ $2,100  (−11.7%) → cierra toda la posición
```

### Gestión activa
- Cuando se ejecuta un BUY → colocar SELL en el nivel inmediato superior
- Cuando se ejecuta un SELL → colocar BUY en el nivel inmediato inferior
- Claude puede verificar qué órdenes se ejecutaron y sugerir las nuevas

### Cuándo usarlo
- Mercado lateral confirmado (ATR estable, funding ~0%)
- Precio en mitad del rango histórico reciente
- Sin catalizadores macro pendientes

### Riesgo
**Bajo-Medio.** El stop global limita la pérdida máxima.
Si el precio sale del rango y toca el stop, se pierde el spread acumulado
más la diferencia entre el precio promedio de compras y el stop.

---

## Estrategia 2 — DCA Escalonado + Trailing Stop

### Concepto
Acumular posición en múltiples niveles debajo del precio actual,
luego proteger con un trailing stop que sigue el precio hacia arriba.
No se fija un TP — se deja correr mientras el precio suba.
El trailing saca la posición automáticamente si el precio revierte.

### Estructura
```
Fase 1 — Acumulación (órdenes BUY LIMIT):
  4 entradas escalonadas debajo del precio

Fase 2 — Una vez ejecutadas las entradas:
  TRAILING_STOP_MARKET con callbackRate X%
  El stop sube automáticamente con el precio
  Se activa solo si el precio revierte X% desde el máximo
```

### Ejemplo con ETH @ $2,379
```
BUY LIMIT @ $2,300  (25% del capital)
BUY LIMIT @ $2,250  (25%)
BUY LIMIT @ $2,200  (25%)
BUY LIMIT @ $2,150  (25%)
Precio promedio estimado: ~$2,225

Con trailing stop 3%:
  Si ETH sube a $2,400 → stop en $2,328
  Si ETH sube a $2,500 → stop en $2,425
  Si ETH sube a $2,600 → stop en $2,522
  Si ETH sube a $2,700 → stop en $2,619
  → Sale solo cuando el precio baja 3% desde el máximo alcanzado
```

### Calibración del callbackRate
| callbackRate | Estilo | Cuándo usar |
|---|---|---|
| 1.5% | Agresivo | Alta volatilidad, ATR grande |
| 2.5% | Balanceado | Condiciones normales |
| 4.0% | Conservador | Lateral, oscilaciones frecuentes |

### Cuándo usarlo
- Post-lateral cuando el precio empieza a mostrar momentum alcista
- Funding rate empezando a subir levemente (compradores tomando control)
- No querés fijar un TP — preferís dejar correr

### Riesgo
**Medio.** Si las compras se ejecutan pero el precio sigue cayendo
antes de activar el trailing, el stop no existe hasta que se configure.
**Importante:** colocar el trailing inmediatamente después de la primera compra ejecutada.

---

## Estrategia 3 — Entrada Escalonada + TPs Parciales + Stop Fijo

### Concepto
La estrategia más clásica y controlada. Entradas en dos niveles,
salidas parciales en tres niveles, stop fijo debajo de todo.
Cada TP ejecutado reduce el riesgo de la posición restante.

### Estructura
```
TAKE_PROFIT_MARKET @ nivel 3  (40% de la posición)
TAKE_PROFIT_MARKET @ nivel 2  (30%)
TAKE_PROFIT_MARKET @ nivel 1  (30%)
─────── entradas ────────────
BUY LIMIT @ precio A  (50%)
BUY LIMIT @ precio B  (50%)
─────────────────────────────
STOP_MARKET @ stop fijo
```

### Ejemplo con ETH @ $2,379
```
TAKE_PROFIT_MARKET @ $2,550  → cerrar 40% (+12% sobre promedio)
TAKE_PROFIT_MARKET @ $2,450  → cerrar 30% (+7.5%)
TAKE_PROFIT_MARKET @ $2,380  → cerrar 30% (+4.4%)
─────────────────────────────
BUY LIMIT @ $2,300  (50%)
BUY LIMIT @ $2,250  (50%)
Promedio: ~$2,275
─────────────────────────────
STOP_MARKET @ $2,150  → cierra todo (−5.5% sobre promedio)
```

### Ratio riesgo/recompensa
- Riesgo máximo: −5.5% sobre promedio de entrada
- TP1 (30% posición): +4.4%
- TP2 (30% posición): +7.5%
- TP3 (40% posición): +12%
- Ganancia promedio si llega a todos los TPs: +8.3%
- **R:R aproximado: 1:1.5** (conservador pero positivo)

### Cuándo usarlo
- Cualquier condición de mercado — es la más versátil
- Ideal para empezar: todo está definido antes de entrar
- Sin decisiones emocionales durante la operación

### Riesgo
**Bajo-Medio.** Todo está definido desde el inicio.
La pérdida máxima posible es conocida antes de colocar la primera orden.

---

## Estrategia 4 — Breakout con Trailing Stop

### Concepto
Esperar que el precio rompa una resistencia clave y entrar en el breakout.
Usar trailing stop para no fijar un techo y capturar el movimiento completo.
Más agresiva — depende de que el breakout sea genuino.

### Estructura
```
Condición de entrada: precio supera resistencia X
  → BUY MARKET (entrada inmediata en el breakout)
  → TRAILING_STOP_MARKET callbackRate 2.5% (colocar inmediatamente)

Sin TP fijo — el trailing define la salida
```

### Ejemplo con ETH @ $2,379
```
Resistencia clave: $2,420 (máximo de los últimos días)

Si ETH cierra 4h por encima de $2,420:
  BUY MARKET
  TRAILING_STOP_MARKET callbackRate 2.5%

Escenarios:
  ETH sube a $2,500 → stop en $2,437 (ganancia mínima garantizada)
  ETH sube a $2,600 → stop en $2,535 (+5% garantizado)
  ETH sube a $2,800 → stop en $2,730 (+13% garantizado)
  ETH rompe y vuelve a $2,420 → stop en ~$2,360 (pérdida pequeña)
```

### Señales de breakout válido (Claude analiza antes de entrar)
- Volumen en la vela de ruptura > promedio últimas 10 velas
- Funding rate subiendo (compradores activos)
- Orderbook: bid pressure > ask pressure
- Precio cierra por encima de la resistencia (no solo toca)

### Cuándo usarlo
- ATR expandiéndose (volatilidad creciente)
- Precio comprimido varios días cerca de resistencia
- Catalizador positivo reciente

### Riesgo
**Medio-Alto.** Los breakouts falsos son frecuentes.
Mitigación: esperar cierre de vela 4h por encima del nivel, no entrar en el toque.

---

## Estrategia 5 — Grid Asimétrico con Trailing Stop

### Concepto
La más sofisticada. Combina la lógica del grid (compras escalonadas abajo)
con trailing stop en lugar de TP fijo. Acumulás posición en la caída,
y si el precio recupera, el trailing captura el movimiento sin techo.

### Estructura
```
Zona de acumulación (compras):
  3-4 BUY LIMIT en niveles debajo del precio

Una vez con posición acumulada:
  TRAILING_STOP_MARKET (reemplaza al TP fijo)
  El trailing sube con el precio → sin techo de ganancia
  Si el precio cae antes de subir → stop fijo manual como red
```

### Ejemplo con ETH @ $2,379
```
BUY LIMIT @ $2,300  (33%)
BUY LIMIT @ $2,250  (33%)
BUY LIMIT @ $2,200  (34%)
Promedio estimado: ~$2,250

Trailing stop 3%:
  Si recupera a $2,350 → stop en $2,280 (cerca del promedio)
  Si recupera a $2,450 → stop en $2,377 (+5.6% garantizado)
  Si recupera a $2,600 → stop en $2,522 (+12% garantizado)

Red de seguridad (stop fijo):
  STOP_MARKET @ $2,100 → por si el precio sigue cayendo
  antes de que el trailing se active
```

### Por qué es superior al grid clásico
- No fijás un techo de ganancia — si el mercado rompe al alza, ganás más
- El trailing reemplaza al TP fijo en cada nivel
- Sigue siendo conservador en la entrada (acumulación escalonada)

### Cuándo usarlo
- Mercado que terminó una corrección y empieza a recuperar
- Funding rate volviendo a neutral desde negativo
- Precio en zona de soporte histórico

### Riesgo
**Medio.** La complejidad está en gestionar el momento de activar el trailing.
Si se activa muy pronto (trailing muy ajustado), sale en la primera oscilación.

---

## Resumen comparativo

| Estrategia | Complejidad | Riesgo | Ideal para | Herramientas |
|---|---|---|---|---|
| 1 — Grid manual clásico | Media | Bajo-Medio | Lateral confirmado | LIMIT + STOP_MARKET |
| 2 — DCA + trailing | Media | Medio | Post-lateral con momentum | LIMIT + TRAILING_STOP |
| 3 — Entradas + TPs + stop | Baja | Bajo-Medio | Cualquier mercado | LIMIT + TAKE_PROFIT + STOP |
| 4 — Breakout + trailing | Baja | Medio-Alto | Ruptura de resistencia | MARKET + TRAILING_STOP |
| 5 — Grid asimétrico + trailing | Alta | Medio | Post-corrección | LIMIT + TRAILING_STOP + STOP |

## Orden recomendado para probar

1. **Estrategia 3** — todo definido antes de entrar, sin decisiones durante
2. **Estrategia 1** — replica tu lógica de grid actual, controllable via API
3. **Estrategia 2** — cuando haya momentum post-lateral claro
4. **Estrategia 5** — cuando tengas más experiencia con las anteriores
5. **Estrategia 4** — la más arriesgada, solo con señales muy claras

---

## Historial de iteraciones

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-04-15 | Versión inicial | Sesión de diseño con Claude + MCP, validación de order types real |
