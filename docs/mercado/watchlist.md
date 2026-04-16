# Watchlist — Seguimiento Activo de Mercado

> Archivo vivo. Se actualiza en cada sesión cuando hay cambios relevantes.
> Última actualización: 2026-04-16
> ⚠️ Los datos de precio/PNL de los bots son snapshots — refrescarlos con la API antes de tomar decisiones.

---

## Bots activos (Pilar 1)

### SOLUSDT — Neutral 3x
| Parámetro | Valor |
|---|---|
| Iniciado | 2026-04-13 23:25 |
| Margen | 1,000 USDT (Isolated) |
| Rango | $68.00 – $110.00 (amplitud 61.7%) |
| Stop loss | $65.00 |
| Grids | 60 |
| Por grid | 0.45 SOL |
| Ganancia grid acum. | +2.31 USDT (+0.23%) |
| PnL no realizado | −0.26 USDT |
| Trades ejecutados | 10 |
| Riesgo Binance | 2.2 — Low Risk |

**Estado al 2026-04-15** — Precio: $84.53 | Posición en rango: **39.4%** (zona media-baja ✅)
Distancia al stop: **23.1%** — bien alejado. Funding neutro. Bot trabajando correctamente.

---

### XRPUSDT — Neutral 3x
| Parámetro | Valor |
|---|---|
| Iniciado | 2026-04-13 23:07 |
| Margen | 1,000 USDT (Isolated) |
| Rango | $1.10 – $1.75 (amplitud 59%) |
| Stop loss | $1.05 |
| Grids | 60 |
| Por grid | 28.0 XRP |
| Ganancia grid acum. | +1.55 USDT (+0.15%) |
| PnL no realizado | −0.30 USDT |
| Trades ejecutados | 7 |
| Riesgo Binance | 2.1 — Low Risk |

**Estado al 2026-04-15** — Precio: $1.387 | Posición en rango: **44.2%** (zona media ✅)
Distancia al stop: **24.3%** — bien alejado. Funding neutro. Bot trabajando correctamente.

---

### BNBUSDT — ⛔ Cerrado
Capital reasignado a XRP y SOL por rendimiento inferior.

---

## En seguimiento — Posibles grids (Pilar 1)

| Par | Precio ref. | Rango sugerido | Rendimiento estimado | Prioridad | Notas |
|---|---|---|---|---|---|
| AVAXUSDT | ~$9.50 | $7.78–$11.08 (42%) | ~$35/mes con $500 (84% anual) | ⭐ Alta | ATR 5.36%, lateral 30/30d, CV 3.4%, precio zona media 58%. Arrancar con $500, escalar a $1,000. Analizado 2026-04-16. |
| BNBUSDT | ~$624 | $530–$723 (36%) | ~$19/mes con $500 (47% anual) | Media | Más estable que AVAX pero menos activo. Opción conservadora si AVAX da señales de salir del rango. |

---

## En seguimiento — Oportunidades activas (Pilar 2)

| Par | Tipo | Detectado | Precio entrada est. | Estructura | Estado | Notas |
|---|---|---|---|---|---|---|
| BIOUSDT | Short pump | 2026-04-15 | $0.0390 avg | 3 entradas SHORT LIMIT + 2 TPs + SL manual | ⛔ Cerrado con pérdida | Entrada $0.0392, cierre MARKET $0.0460. Pérdida: **-$40.80 USDT**. Causa: funding -0.82% ignorado → squeeze clásico. Ver lecciones. |
| LYNUSDT | Short pump | 2026-04-16 | — | — | 👁️ En radar | +35% 24h. Funding ✅ +0.05%. Pero RSI 43 (neutral) y pump solo 55% — no sobreextendido. Esperar rebote a zona $0.082–$0.087 con RSI >75 para evaluar entrada short. Fase 4-5 actual. |
| GUAUSDT | Short pump | 2026-04-15 | $0.57–$0.62 | Short grid LIMIT + stop | 📋 Desactualizado | Re-analizar si el usuario lo solicita. |
| TRADOORUSDT | Short pump | 2026-04-16 | $7.20–$7.60 | 2 entradas SHORT LIMIT + 2 TPs + SL manual | ❌ Descartado | Precio bajó a $6.23. Pump total solo 24% desde mínimos — lejos de las condiciones (≥80%). Sin setup. |
| BASEDUSDT | Short pump | 2026-04-16 | $0.260–$0.290 | 3 entradas SHORT LIMIT + TP fijo + SL + TS | 👁️ En radar | +306% desde mínimos. Funding ✅ +0.19%. RSI 85. Ya corrigió 32% del pico ($0.327→$0.222). Esperar rebote a $0.265 con RSI >78 y volumen bajo. **Alarma puesta en $0.265 ↑** |
| ORDIUSDT | Short pump | 2026-04-16 | $8.80–$9.20 | 3 entradas SHORT LIMIT + TP fijo + SL + TS | 👁️ En radar | Pump +225%. Precio $8.44, pico $9.70. Corrección activa. Esperar rebote a $8.85 con RSI >75. **Alarma puesta en $8.85 ↑** |

---

## Histórico — Cerrados / Descartados

| Par | Tipo | Resultado | Fecha | Notas |
|---|---|---|---|---|
| BNBUSDT | Grid Neutral | Cerrado | Abr 2026 | Rendimiento inferior. Capital reasignado. |
| TRADOOR | Short manual | +53.56 USDT (+26.78%) en 27hs | ~12 Abr 2026 | Operación exitosa. Confirma estrategia short en pumps. |
| BTCUSDT | Grid Neutral 10x | Desarmado (salió del rango) | ~14 Abr 2026 | 10x excesivo. BTC superó 74,500. Lección: max 3x-5x. |
| ETHUSDT | Grid Neutral 10x | +23.87 USDT, desarmado | ~14 Abr 2026 | Rango correcto, apalancamiento alto. ETH rompió al alza. |
| ORDIUSDT | Short manual | ~-$0.07 USDT (pérdida mínima) | 16 Abr 2026 | Pump +182%. 2 entradas llenadas ($9.00 y $9.50), 3era pendiente ($10.00). Trailing stop activado en movimiento alcista antes de que entrara la 3era orden — cerró la posición con pérdida mínima. El TS funcionó correctamente pero el precio de activación era demasiado bajo. Lección: activar TS más cerca del pico para dar margen a todas las entradas. |

---

## Lecciones registradas

| Fecha | Lección |
|---|---|
| Abr 2026 | 10x en grid neutral es demasiado. Máximo 3x-5x para grids conservadores. |
| Abr 2026 | Al cerrar un bot la posición residual NO se cierra sola. Cerrar con orden límite. |
| Abr 2026 | BTC en 74,500 fue posible trampa de liquidez. Esperar confirmación en resistencias. |
| Abr 2026 | Grid API no disponible (404). Los grids se crean solo desde UI de Binance. |
| Abr 2026 | LIMIT orders en futuros sí funcionan via API. Útil para Pilar 2. |
| Abr 2026 | Hedge Mode activo en la cuenta: siempre incluir `positionSide` en cada orden. |
| Abr 2026 | **STOP_MARKET y STOP dan error -4120** — Binance los redirige a Algo Order API no pública. Sin stop funcional via API no se puede operar con capital real de forma responsable. |
| Abr 2026 | LIMIT BUY como stop manual no sirve — Binance limita el precio al 5% sobre el mark price, lo ejecuta inmediatamente si el precio está cerca. Cerró una posición short accidentalmente. |
| Abr 2026 | Validar TAKE_PROFIT y TRAILING_STOP_MARKET en testnet antes de usar con capital real. |
| Abr 2026 | **SELL LIMIT por debajo del precio de mercado se ejecuta inmediatamente** — para entradas SHORT escalonadas, los precios deben estar POR ENCIMA del precio actual (o al menos en el precio actual), no por debajo. Si se colocan debajo, Binance las llena al instante como si fueran MARKET. Todas las entradas se llenaron en 2 segundos en la operación BIOUSDT. |
| Abr 2026 | Verificar siempre que el margen sea **Isolated**, no Cross, antes de confirmar la estrategia. Cross expone todo el balance de la cuenta. |
| Abr 2026 | **Funding negativo = NO shortear.** Funding -0.82% en BIOUSDT significaba que el mercado ya estaba lleno de shorts → squeeze → el precio subió +15% después de entrar. Funding positivo (longs pagando) es la señal correcta para un short. |
| Abr 2026 | **Analizar siempre el volumen en el pico.** RSI 96 solo no confirma reversión. Si el volumen sigue alto en el pico, el pump puede continuar. |
| Abr 2026 | **Presentar siempre mínimo 2 estrategias alternativas.** Una sola propuesta no da contexto al usuario para decidir. El usuario elige, Claude no decide solo. |
| Abr 2026 | **Si el análisis tiene señales contradictorias → decirlo explícitamente y no recomendar.** Es preferible decir "no hay setup claro" que forzar una estrategia con datos mixtos. |
| Abr 2026 | **La app móvil de Binance tiene mínimo notional ~$1,000 para coins de precio muy bajo**, aunque la API acepta desde $5. Si el usuario no llega a ese mínimo no puede colocar el SL manual → trade inviable. Verificar siempre antes de proponer. LYNUSDT descartado por esto ($59 disponibles vs $1,000 mínimo UI). |
| Abr 2026 | **La API de tickers devuelve contratos en SETTLING** — pares que Binance está cerrando, no aparecen en la UI del usuario y no aceptan nuevas órdenes. Siempre cruzar con `exchangeInfo` y filtrar solo `status=TRADING` antes de mostrar candidatos. ALPACAUSDT y BNXUSDT eran SETTLING.
| Abr 2026 | **Frenar al usuario cuando entra apurado siguiendo el precio.** Una vela roja no es reversión. Esperar mínimo 2 velas 15m consecutivas bajistas con volumen antes de confirmar entrada short. |
| Abr 2026 | **Trailing Stop para SHORT: activar SIEMPRE más arriba del precio de entrada más alto.** El TS en SHORT se activa cuando el precio sube X% desde el punto más bajo tocado. Si el precio nunca baja (sigue subiendo), el TS cierra la posición en pérdida. La clave: activar el TS en un precio cercano al pico (ej. 3-5% bajo el máximo), NO en el precio de entrada. Así si el precio sube antes de que entren todas las órdenes, el TS tiene margen suficiente. |
| Abr 2026 | **Protocolo post-ejecución SHORT: SL + TS simultáneos.** Después de que Claude coloca las entradas LIMIT, el usuario debe configurar en la UI de Binance AMBAS protecciones al mismo tiempo: (1) Stop Loss fijo en el precio de invalidación y (2) Trailing Stop activado cerca del pico con callback 5-8%. El SL protege si hay un spike rápido, el TS captura la ganancia en la bajada. Ver protocolo detallado en `docs/protocolo-operativo.md`. |

---

## Pendientes próxima sesión

- [ ] Re-analizar GUAUSDT en 24hs (RSI estaba en 11, posible rebote técnico)
- [ ] Escaneo general de futuros cuando el usuario lo solicite
