# Protocolo Operativo — Índice

> Referencia operativa completa del sistema. CLAUDE.md apunta aquí para todos los detalles.
> Última actualización: 2026-04-18

---

## El flujo completo en 5 pasos

```
1. ANÁLISIS DE MERCADO        → 01-analisis.md
       ↓
2. DISEÑO DE ESTRATEGIA       → 03-estrategias.md
   (SHORT o LONG — estructuras diferentes)
       ↓
3. VALIDACIÓN EN TESTNET      → 04-ejecucion.md
       ↓
4. REVISIÓN FINAL             → 04-ejecucion.md
       ↓
5. EJECUCIÓN EN PRODUCCIÓN    → 04-ejecucion.md
   (modelo híbrido)
```

---

## Documentos de este protocolo

| Archivo | Contenido |
|---|---|
| [01-analisis.md](01-analisis.md) | Contexto macro, escaneo de candidatos, checklist de veto, fases del pump, confirmación bajista, entrada long |
| [02-funding.md](02-funding.md) | Funding rate completo — semáforo, tendencia, regla contextual (reemplaza la regla binaria) |
| [03-estrategias.md](03-estrategias.md) | Estructura SHORT (Tipo A/B) y LONG — entradas, TP, SL, TS |
| [04-ejecucion.md](04-ejecucion.md) | Pasos 3-4-5: testnet, revisión final, ejecución producción, monitor loop |
| [lecciones.md](lecciones.md) | Todas las lecciones registradas, organizadas por tema |

---

## Reglas transversales (aplican en todo el protocolo)

- Siempre **contexto macro PRIMERO** antes de analizar candidatos individuales
- **Mínimo 2 estrategias alternativas** cuando hay setup válido + la opción "no operar"
- **Declarar entorno** (🔵 testnet / 🔴 producción) antes de cualquier ejecución
- **Hedge Mode activo** en producción → `positionSide: LONG` o `SHORT` en todas las órdenes
- Funding rate: ver [02-funding.md](02-funding.md) para la regla completa — no es un veto binario

---

## Limitaciones del sistema (a 2026-04-18)

| Limitación | Impacto | Workaround |
|---|---|---|
| STOP_MARKET/TP/TS bloqueados en endpoint clásico (`/fapi/v1/order`, error -4120) | No se pueden usar con `BinanceCustomFuturesNewOrder` | Usar `BinanceCustomFuturesAlgoOrder` → `/fapi/v1/algoOrder` ✅ funciona |
| Grids de futuros no disponibles via API | No crear grids desde Claude | Crear desde UI de Binance. Verificado: endpoint `/sapi/v1/algo/futures/newOrderGrid` da 404 — Binance no lo expone públicamente. `BinanceCreateFutureGrid` existe en el MCP pero está roto. |
| Hedge Mode en cuenta real | Todas las órdenes requieren `positionSide` | Siempre incluir LONG/SHORT |
| Testnet en One-way Mode | Scripts deben adaptarse | No enviar `positionSide` en testnet |
| TP en Hedge Mode | No se puede colocar antes de tener posición | Colocar TP/SL/TS solo después de la primera entrada |

→ Ver lecciones relacionadas: [lecciones.md#ejecucion-tecnica](lecciones.md#ejecucion-tecnica)
