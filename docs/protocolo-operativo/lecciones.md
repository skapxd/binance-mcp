# Lecciones de Ejecución Registradas

> Cada lección tiene origen en una operación real o error cometido.
> Organizadas por tema para facilitar consulta al diseñar nuevas estrategias.

---

## Ejecución técnica

| Fecha | Lección |
|---|---|
| Abr 2026 | **SELL LIMIT por debajo del precio = ejecución inmediata.** Todas las entradas SHORT deben estar POR ENCIMA del precio actual para quedar pendientes. → Ver [03-estrategias.md](03-estrategias.md) |
| Abr 2026 | **TP en Hedge Mode antes de tener posición → error -2022.** Colocar TPs solo después que entre la primera orden. |
| Abr 2026 | **Si SL o TS activa con entradas pendientes → cancelarlas inmediatamente.** Una entrada que se llena después de cerrar la posición abre nueva exposición no controlada. |
| Abr 2026 | **Verificar siempre Isolated antes de ejecutar.** Cross expone todo el balance. |
| Abr 2026 | **Precision error (-1111): usar cantidades enteras o con mínimos decimales.** Binance rechaza `16.600` — usar `17`. |
| Abr 2026 | **El script monitor.cjs usa extensión .cjs (no .js).** El proyecto tiene "type":"module" en package.json — los scripts CommonJS deben tener extensión .cjs o Node los rechaza con ReferenceError: require is not defined. |
| Abr 2026 | **Stop Market en UI de Binance: usar "Stop Market" no "Stop Limit".** Stop Limit puede saltear la orden si el precio cae rápido. Stop Market se ejecuta al instante. Campo a llenar: solo "Precio Stop". |
| Abr 2026 | **CancelAlgoOrder requiere tanto `algoId` como `symbol`.** Llamar con solo `algoId` da InputValidationError. Obtener el algoId con `BinanceCustomFuturesAlgoOpenOrders` primero. |

---

## Análisis de entrada

| Fecha | Lección |
|---|---|
| Abr 2026 | **Trailing Stop SHORT: activar entre el pico y la primera entrada, no en la entrada.** Si se activa en el precio de entrada y el precio sube antes de bajar, el TS cierra sin ganancia (lección ORDI). → Ver [03-estrategias.md](03-estrategias.md) |
| Abr 2026 | **Pump de vela única (PRLUSDT): LIMIT en el rebote nunca se llena.** Vela 4h +54% con 46M vs 1-2M promedio → colapso directo sin rebote. Estrategia: B1 (LIMIT en el pico con RSI >90) o B2 (MARKET en primera vela roja). |
| Abr 2026 | **Mecha larga en el pico = señal de agotamiento más clara que RSI.** Lección ENAUSDT: el precio llegó arriba y rechazó rápido sin cierre alto → liquidación de longs confirmada. Entrar B2 (MARKET) en vez de esperar rebote para LIMIT. |
| Abr 2026 | **Contratos SETTLING aparecen en el ticker API pero no en la UI.** Siempre filtrar `status=TRADING` via `exchangeInfo` antes de proponer candidatos. ALPACA y BNX mostraban velas en 0 — eran contratos en proceso de delisting. |

---

## Funding rate

| Fecha | Lección |
|---|---|
| Abr 2026 | **BIOUSDT: funding -0.82% → squeeze +15%.** El mercado ya estaba masivamente posicionado bajista. Entrar short con funding muy negativo = asumir que el squeeze ya ocurrió cuando aún no. Esto generó la regla original de veto binario. |
| Abr 2026 | **Regla de veto binario era demasiado rígida.** ALICE con funding -0.27% pero precio ya bajó >20%, volumen agotado, RSI medio — la regla anterior habría vetado un setup potencialmente válido. Reemplazada por la regla contextual de 5 filtros. → Ver [02-funding.md](02-funding.md) |
| Abr 2026 | **`lastFundingRate` puede estar desactualizado hasta 8hs.** Siempre consultar también el historial de 4 períodos para ver la tendencia real. El historial puede mostrar empeoramiento aunque el último valor parezca bajo. |
| Abr 2026 | **Calcular el próximo reset manualmente es propenso a error.** Usar `nextFundingTime` de `/fapi/v1/premiumIndex` para el timestamp exacto. No estimar desde los horarios fijos UTC. |

---

## Estrategias

| Fecha | Lección |
|---|---|
| Abr 2026 | **Long rebote válido: RSI 15m ≤ 22 + funding positivo + volumen real.** ORDIUSDT cayó -26% con 1900M vol, RSI 15m tocó 21, funding +0.005%. Señal de entrada: RSI 15m cruza 35 + vela verde con >5M vol. Resultado: +$7.34 en ~30 min. |
| Abr 2026 | **Grid DOGE: CV 2.75% más lateral del top 25, pero ciclos cortos = ganancia menor.** $0.21/trade vs $0.28-0.30 esperado. Capital mejor aprovechado en SOL/ADA con más amplitud de rango. |
| Abr 2026 | **Grid geométrico vs aritmético: geométrico = % fijo entre niveles, aritmético = $ fijo.** Todos los grids implementados en este sistema son geométricos. La diferencia importa al calcular spacing y capital por nivel. |
