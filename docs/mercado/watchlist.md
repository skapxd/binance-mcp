# Watchlist — Seguimiento Activo de Mercado

> Archivo vivo. Se actualiza en cada sesión cuando hay cambios relevantes.
> Última actualización: 2026-04-18
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

### ADAUSDT — Neutral 3x
| Parámetro | Valor |
|---|---|
| Iniciado | 2026-04-17 |
| Margen | 1,000 USDT (Isolated) |
| Rango | $0.203 – $0.325 (amplitud 60.1%) |
| Stop loss | $0.194 |
| Grids | 60 — Geométrico |
| Ganancia grid acum. | — (recién iniciado) |
| PnL no realizado | — |
| Trades ejecutados | — |

**Estado al 2026-04-17** — Precio: $0.254 | Posición en rango: **41.6%** (zona media ✅)
Distancia al stop: **23.6%** — bien alejado. Funding neutro +0.010%. Bot recién iniciado.
Nota: Protocol 11 hard fork confirmado para junio 2026 — evaluar ajuste del bot en mayo si se acerca el evento.

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
| PIPPINUSDT | Short pump | 2026-04-17 | $0.04201 avg | 2 entradas MARKET + 2 TPs ($0.030/$0.026) + SL | ⛔ Cerrado | Cierre manual $0.03508. **+~$44.86 USDT (+50% ROI)** sobre $89.72 margen. Pump +167% sin fundamento. Estrategia correcta aplicada. |
| BIOUSDT | Short pump | 2026-04-15 | $0.0390 avg | 3 entradas SHORT LIMIT + 2 TPs + SL manual | ⛔ Cerrado con pérdida | Entrada $0.0392, cierre MARKET $0.0460. Pérdida: **-$40.80 USDT**. Causa: funding -0.82% ignorado → squeeze clásico. Ver lecciones. |
| ORDIUSDT | Long rebote | 2026-04-18 | ~$6.00–$6.10 | BUY LIMIT + SL $5.70 + TP $6.80–$7.20 | 👁️ En radar | −26% 24h desde pico $10.76. RSI 15m en 21 (muy sobrevendido). Funding +0.005% ✅. Vol 1,901M. Esperar primera vela verde 15m con volumen tras RSI <25. Alarma: $5.85 ↓ rebote. |
| ENAUSDT | Short pump | 2026-04-17 | $0.1286 MARKET | SHORT MARKET 3,499 ENA + 2 TPs + SL $0.14 + TS $0.1230 | ⛔ Cerrado con pérdida | Entrada $0.1286, cierre manual ~$0.1320. Pérdida: **-$11.93 USDT**. Entrada tarde (-3.4% del pico). Rebote sostenido volvió al pico sin confirmar reversión. El loop detectó la zona de peligro a tiempo — se salió antes del SL ($0.14). Ver lecciones. |
| SKLUSDT | Short pump | 2026-04-18 | ~$0.0090–$0.0098 | SHORT LIMIT escalonado + SL + TS | 👁️ En radar | +48% 24h, spike +54% desde mínimo. RSI 1h 85. Funding −0.371% ahora → VETO hasta que gire positivo (reset 16:00 UTC). Además capital insuficiente (<$1000 notional UI). Alarma: $0.0095 ↑ + verificar funding antes de entrar. |
| MOVRUSDT | Short pump | 2026-04-18 | — | — | 👁️ En radar | +140% 24h pero funding −0.037% → vetado. Mejor momento ya pasó. Monitorear si funding gira positivo. |
| LYNUSDT | Short pump | 2026-04-16 | — | — | 👁️ En radar | +35% 24h. Funding ✅ +0.05%. Pero RSI 43 (neutral) y pump solo 55% — no sobreextendido. Esperar rebote a zona $0.082–$0.087 con RSI >75 para evaluar entrada short. Fase 4-5 actual. |
| GUAUSDT | Short pump | 2026-04-15 | $0.57–$0.62 | Short grid LIMIT + stop | 📋 Desactualizado | Re-analizar si el usuario lo solicita. |
| TRADOORUSDT | Short pump | 2026-04-16 | $7.20–$7.60 | 2 entradas SHORT LIMIT + 2 TPs + SL manual | ❌ Descartado | Precio bajó a $6.23. Pump total solo 24% desde mínimos — lejos de las condiciones (≥80%). Sin setup. |
| BASEDUSDT | Short pump | 2026-04-16 | $0.225–$0.265 | 3 entradas SHORT LIMIT + SL + TS | ⛔ Descartado | Órdenes colocadas y canceladas. Precio cayó de $0.327 a $0.156 sin rebote. Pump terminado. |
| ORDIUSDT | Short pump | 2026-04-16 | $9.20–$9.75 | 3 entradas SHORT LIMIT + SL + TS | 👁️ En radar | Pump +215%. Precio $8.47, pico $9.70. En corrección. Si rebota a $9.20+ con RSI >80 → reentrada. |
| PRLUSDT | Short pump | 2026-04-16 | $0.385–$0.420 | 3 entradas SHORT LIMIT + SL + TS | ⛔ Descartado | Pump +151%. Dos intentos de entrada fallidos. 1er intento ($0.410–$0.450): precio nunca rebotó. 2do intento ($0.385–$0.420): precio colapsó a $0.337 sin rebote. Causa: pump de vela única (4h +54%, 46M vs 1-2M promedio) → colapso directo sin rebote. Estrategia errónea: LIMIT esperando rebote en pump de tipo B. |

---

## Histórico — Cerrados / Descartados

| Par | Tipo | Resultado | Fecha | Notas |
|---|---|---|---|---|
| BNBUSDT | Grid Neutral | Cerrado | Abr 2026 | Rendimiento inferior. Capital reasignado. |
| TRADOOR | Short manual | +53.56 USDT (+26.78%) en 27hs | ~12 Abr 2026 | Operación exitosa. Confirma estrategia short en pumps. |
| BTCUSDT | Grid Neutral 10x | Desarmado (salió del rango) | ~14 Abr 2026 | 10x excesivo. BTC superó 74,500. Lección: max 3x-5x. |
| ETHUSDT | Grid Neutral 10x | +23.87 USDT, desarmado | ~14 Abr 2026 | Rango correcto, apalancamiento alto. ETH rompió al alza. |
| ORDIUSDT | Short — 1er intento | ~-$0.07 USDT (pérdida mínima) | 16 Abr 2026 | Pump +182%. 2 entradas llenadas ($9.00 y $9.50), 3era pendiente ($10.00). TS activado en movimiento alcista antes de que entrara la 3era orden. TS correcto pero activación demasiado baja. |
| ORDIUSDT | Short — 2do intento | **+$8.76 USDT** | 16 Abr 2026 | 1 entrada @ $9.20 (13 ORDI). Cierre TS @ $8.526. Entradas 2 y 3 canceladas manualmente antes del cierre. Protocolo SL + TS correcto aplicado. Ganancia neta confirmada por API. |
| ORDIUSDT | Long rebote | **+$7.34 USDT** | 18 Abr 2026 | Entry $6.08 MARKET, cierre manual $6.32. RSI 15m en 21 + funding +0.005% + vol 1900M. Señal detectada por monitor-ordi.cjs. Limpio y rápido ~30 min. |
| PIPPINUSDT | Short pump | **+$44.86 USDT (+50% ROI)** | 17 Abr 2026 | Entry avg $0.04201, cierre $0.03508. 2 entradas MARKET urgentes. TPs ajustados durante la operación. Estrategia limpia aplicada. |

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
| Abr 2026 | **Cancelar entradas pendientes cuando el TS se activa.** Si el TS cierra la posición y quedan LIMIT entries abiertas, esas órdenes abren una nueva posición sin SL ni TS configurados. Cancelar siempre desde "Órdenes abiertas" antes o apenas se activa el TS. Confirmado en ORDI 2do intento — cancelar las entradas 2 y 3 fue la decisión correcta. |
| Abr 2026 | **Con 1 sola entrada y TS bien configurado, la estrategia funciona limpiamente.** ORDI 2do intento: 1 entrada @ $9.20, TS activación $8.50 callback 6%, cierre @ $8.526, +$8.76 USDT. No siempre hace falta llenar las 3 entradas para que la operación sea rentable. |
| Abr 2026 | **Entrar tarde en un short (>3% del pico) reduce drásticamente el margen de seguridad.** ENAUSDT: entrada a -3.4% del pico → el rebote técnico normal de vuelta al pico fue suficiente para activar el SL. La ventana de entrada óptima es dentro del -1.5% del pico con señal confirmada. Si el precio ya bajó >3% sin confirmación clara → no entrar, esperar rebote para mejor precio. |
| Abr 2026 | **El loop de seguimiento con alerta de reversión funcionó correctamente.** ENAUSDT: loop detectó precio rozando $0.132 y avisó a tiempo para salir con -$11.93 en lugar de -$40 (SL). El monitoreo minuto a minuto es clave para salidas anticipadas cuando el trade no va como esperado. |
| Abr 2026 | **Pump de vela única (Tipo B): LIMIT esperando rebote = órdenes que nunca se llenan.** PRLUSDT vela 4h +54% con 46M vs 1-2M promedio → colapso directo a $0.337 sin rebote. Dos intentos de LIMIT fallidos. En este tipo de pump: B1 = LIMIT en el pico cuando RSI >90, o B2 = MARKET en primera vela 15m roja. Ver protocolo Tipo A vs Tipo B en `docs/protocolo-operativo.md`. |

---

## Pendientes próxima sesión

- [ ] MOVRUSDT: revisar si funding se vuelve positivo (ahora -0.047%, vetado). Si gira → analizar short.
- [ ] Escaneo general de futuros cuando el usuario lo solicite
- [ ] Re-analizar GUAUSDT si el usuario lo solicita
