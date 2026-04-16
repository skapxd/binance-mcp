# Estrategia: TWAP + Sells Escalonados (Grid Manual Asimétrico)

> Documento vivo — se actualiza con cada iteración y feedback real.
> Última actualización: 2026-04-15

> ⚠️ **Revisión 2026-04-15:** TWAP de Futuros no disponible via API (endpoint no público).
> La estrategia se reformula usando **órdenes LIMIT escalonadas** en futuros, que sí funcionan.
> Ver sección "Adaptación con LIMIT orders" más abajo.

---

## Concepto central

Un grid neutral nativo de Binance hace dos cosas en loop:
1. Compra en nivel X → coloca venta en X+1
2. Vende en X+1 → vuelve a comprar en X

Esta estrategia replica ese comportamiento en dos fases separadas:

**Fase 1 — TWAP:** acumula posición larga gradualmente en el rango inferior,
promediando el precio de entrada sin mover el mercado.

**Fase 2 — Sells escalonados:** sobre esa posición acumulada, coloca múltiples
órdenes LIMIT SELL en niveles superiores que actúan como el "techo" del grid.

El resultado es una posición comprada a precio promedio con salidas parciales
predefinidas en cada nivel de ganancia.

---

## Cuándo aplicar esta estrategia

**Condiciones ideales:**
- Mercado lateral o post-corrección (precio digiriendo un movimiento)
- ATR 4h estable o decreciendo
- Funding rate cerca de 0% (sin presión direccional fuerte)
- Precio en la mitad-baja del rango de las últimas 2 semanas
- Ratio bid/ask ordenbook ~1 (equilibrado)

**No aplicar cuando:**
- Funding rate alto positivo (mercado sobrecomprado, riesgo de corrección)
- ATR creciendo fuerte (volatilidad en expansión)
- Precio cerca de máximos del rango (poco upside para los sells)
- Noticias macro pendientes (FOMC, CPI, etc.)

---

## Estructura de la estrategia

```
Precio actual: $2,344 (ejemplo ETH 2026-04-15)

FASE 1 — TWAP (acumulación)
├── Monto: $X USDT
├── Duración: 2-4 horas
├── Objetivo: precio promedio de entrada ~$2,300-2,320
└── Resultado: posición larga acumulada

FASE 2 — Sells escalonados (techo del grid)
├── Nivel 1: venta del 20% en $2,390  (+3.0%)
├── Nivel 2: venta del 20% en $2,430  (+4.7%)
├── Nivel 3: venta del 20% en $2,470  (+6.4%)
├── Nivel 4: venta del 20% en $2,510  (+8.2%)
└── Nivel 5: venta del 20% en $2,550  (+9.8%)

STOP LOSS
└── Cierre total si precio cae bajo $2,150 (-8% desde entrada promedio)
```

---

## Parámetros TWAP

| Parámetro | Valor recomendado | Notas |
|---|---|---|
| `symbol` | ETHUSDT | o el par analizado |
| `side` | BUY | acumulación larga |
| `quantity` | monto en USDT | entre $1,000 y $1,000,000 |
| `duration` | 7200 – 14400 (2-4hs) | ajustar según urgencia |
| `limitPrice` | precio inferior del rango | evita comprar si el precio sube mucho |
| `positionSide` | LONG (hedge mode) o BOTH | según configuración de cuenta |

**Sobre el `limitPrice`:**
Si el precio sube durante el TWAP, el `limitPrice` actúa como techo de compra.
Si el mercado sube y supera el límite, el TWAP se pausa — protección natural.

---

## Cálculo de niveles de venta

Los niveles se calculan de forma **geométrica** (proporcional) para adaptarse al rango:

```
precio_entrada_promedio = P
ratio = (upper / P) ^ (1/N)   donde N = cantidad de niveles

nivel_1 = P × ratio^1
nivel_2 = P × ratio^2
...
nivel_N = P × ratio^N = upper
```

Ejemplo con P=$2,310, upper=$2,550, N=5:
- ratio = (2550/2310)^(1/5) = 1.0199
- Nivel 1: $2,310 × 1.0199 = $2,356
- Nivel 2: $2,310 × 1.0199² = $2,403
- Nivel 3: $2,310 × 1.0199³ = $2,451
- Nivel 4: $2,310 × 1.0199⁴ = $2,500
- Nivel 5: $2,310 × 1.0199⁵ = $2,550

---

## Variantes de la estrategia

### Variante A — Conservadora (recomendada para empezar)
- TWAP largo (3-4hs), límite bajo
- Pocos niveles de venta (3-4), rangos amplios
- Stop loss amplio (-10%)
- Ideal para mercado muy lateral

### Variante B — Activa
- TWAP corto (1-2hs), sin límite de precio
- Más niveles (6-8), rangos ajustados
- Stop loss ajustado (-5%)
- Ideal para lateral con momentum leve

### Variante C — Re-entrada automática (objetivo futuro)
- Cuando todos los sells se ejecutan → nueva ronda de TWAP
- Loop continuo mientras el mercado siga lateral
- Requiere monitoreo activo o sistema de alertas

---

## Adaptación con LIMIT orders (estrategia real disponible)

Dado que TWAP de futuros no es accesible via API, la fase de acumulación
se reemplaza con **órdenes LIMIT BUY escalonadas** en niveles debajo del precio actual.
El resultado es equivalente: precio promedio de entrada distribuido en varios niveles.

```
Precio actual: $2,379

Compras LIMIT escalonadas (reemplaza al TWAP):
  BUY 0.01 ETH LIMIT @ $2,300  (−3.3%)
  BUY 0.01 ETH LIMIT @ $2,250  (−5.4%)
  BUY 0.01 ETH LIMIT @ $2,200  (−7.5%)
  BUY 0.01 ETH LIMIT @ $2,150  (−9.6%)

Sells escalonados sobre la posición acumulada:
  SELL LIMIT @ $2,420  (+5.2% sobre promedio)
  SELL LIMIT @ $2,470  (+7.4%)
  SELL LIMIT @ $2,520  (+9.6%)
  SELL LIMIT @ $2,570  (+11.7%)

Stop loss:
  STOP_MARKET @ $2,100 (cierra todo si rompe el piso)
```

**Consideraciones para Hedge Mode** (activo en la cuenta):
- Todas las órdenes BUY deben incluir `positionSide: LONG`
- Todas las órdenes SELL deben incluir `positionSide: LONG` (para cerrar la posición long)
- El timestamp siempre debe tomarse del servidor Binance, no del sistema local

---

## Ventajas vs grid nativo de Binance

| Aspecto | Grid nativo Binance | Esta estrategia |
|---|---|---|
| Precio de entrada | Órdenes fijas desde el inicio | TWAP promedia la entrada |
| Impacto en mercado | Órdenes visibles en orderbook | TWAP es menos detecteable |
| Flexibilidad | Parámetros fijos al crear | Ajustable en tiempo real |
| Control | Solo desde UI | Controlable via API/Claude |
| Re-entry | Automático | Manual (por ahora) |
| Disponibilidad API | ❌ No disponible | ✅ Disponible (via LIMIT orders) |

---

## Limitaciones conocidas

- TWAP de futuros no disponible — reemplazado por LIMIT orders escalonadas
- `MIN_NOTIONAL` real de ETHUSDT futuros es $20 USDT por orden (mínimo ~0.01 ETH)
- Las órdenes limit de venta son estáticas: si el precio vuelve a bajar después de ejecutar
  un nivel, hay que re-comprar manualmente para mantener el grid
- No hay loop automático todavía — cada "vuelta" del grid requiere intervención
- **Hedge Mode activo**: todas las órdenes requieren `positionSide` explícito

---

## Próximos pasos para evolucionar esta estrategia

- [ ] Definir tamaño mínimo de cuenta para aplicarla con sentido ($500+)
- [ ] Probar en testnet con TWAP real y verificar precios promedio obtenidos
- [ ] Diseñar lógica de re-entrada: cuándo volver a acumular después de los sells
- [ ] Evaluar usar VP (Volume Participation) en lugar de TWAP para entradas >$10,000
- [ ] Crear script de cálculo automático de niveles según precio actual y ATR

---

## Historial de iteraciones

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-04-15 | Versión inicial | Primera sesión de diseño con Claude + MCP |
| 2026-04-15 | TWAP futuros reemplazado por LIMIT orders | Endpoint TWAP futuros confirmado como no público |
| 2026-04-15 | Agregada sección Hedge Mode | Cuenta tiene Hedge Mode activo, requiere positionSide en todas las órdenes |
