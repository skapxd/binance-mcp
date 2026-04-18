# Pasos 3-4-5 — Testnet, Revisión y Ejecución

---

## Paso 3 — Validación en testnet

**Cuándo:** al configurar el sistema por primera vez, o si aparece un error nuevo en producción.
**NO es obligatorio antes de cada operación** — LIMIT/MARKET ya están validados.
**Comando:** `node testnet-validator.js` desde la raíz del proyecto.

### Estado validado de endpoints (actualizado 2026-04-18)

| Tipo | Endpoint clásico `/fapi/v1/order` | Algo Order `/fapi/v1/algoOrder` |
|---|---|---|
| `LIMIT` | ✅ Funciona | — |
| `MARKET` | ✅ Funciona | — |
| `STOP_MARKET` | ❌ -4120 | ✅ `BinanceCustomFuturesAlgoOrder` |
| `TAKE_PROFIT_MARKET` | ❌ -4120 | ✅ `BinanceCustomFuturesAlgoOrder` |
| `TRAILING_STOP_MARKET` | ❌ -4120 | ✅ `BinanceCustomFuturesAlgoOrder` |

**Siempre usar `BinanceCustomFuturesAlgoOrder` para SL/TP/TS** — nunca intentar estos tipos por el endpoint clásico.

Si algún resultado cambia → actualizar `docs/api-reference/capacidades-mcp.md`.

### Simular la estrategia en testnet (3b)

Ejecutar las órdenes exactas en testnet: mismos precios, mismas cantidades, mismo leverage.
Verificar que todas se crean correctamente y respetan los filtros del símbolo.

**Solo si 3b pasa sin errores → avanzar al paso 4.**

---

## Paso 4 — Revisión final antes de producción

Checklist que Claude verifica antes de ejecutar con capital real:

- [ ] ¿El precio sigue dentro del rango analizado? (revalidar precio actual)
- [ ] ¿El funding rate sigue siendo favorable a la estrategia?
- [ ] ¿El RSI no cambió significativamente desde el análisis?
- [ ] ¿Hay noticias macro pendientes en las próximas 4hs? (FOMC, CPI, etc.)
- [ ] ¿El capital a usar representa menos del 20% del capital total disponible?
- [ ] ¿Tiene stop loss definido aunque sea monitoreado manualmente?
- [ ] ¿El usuario confirmó la ejecución explícitamente?

Si algún punto falla → volver al paso 1.

---

## Paso 5 — Ejecución en producción (modelo híbrido)

El sistema opera en modo **híbrido**: Claude ejecuta via API, el usuario hace manualmente lo que Binance bloquea.

### Lo que Claude ejecuta

| Acción | Tipo | Estado |
|---|---|---|
| Entradas escalonadas | LIMIT | ✅ |
| Take Profit (solo después de tener posición) | LIMIT / TAKE_PROFIT_MARKET via Algo | ✅ |
| Stop Loss | STOP_MARKET via Algo | ✅ |
| Trailing Stop | TRAILING_STOP_MARKET via Algo | ✅ |
| Cierre de emergencia | MARKET | ✅ si el usuario lo pide |

**Nota sobre Algo Order API:** STOP_MARKET, TAKE_PROFIT_MARKET y TRAILING_STOP_MARKET van por `BinanceCustomFuturesAlgoOrder` (endpoint `/fapi/v1/algoOrder`). Usar `triggerPrice` en vez de `stopPrice`. El endpoint clásico `/fapi/v1/order` da error -4120 para estos tipos.

### Lo que el usuario puede hacer manualmente (UI de Binance — alternativa)

| Acción | Dónde |
|---|---|
| Stop Loss (Stop Market) | Futures → posición → Add SL/TP |
| Trailing Stop | Futures → posición → Trailing Stop |
| Cancelar entradas pendientes si SL/TS activa | Futures → Open Orders → cancelar |
| Grid bots | Futures → Bot Trading → Grid |

### Protocolo de entorno — declarar SIEMPRE antes de ejecutar

**Testnet:**
```
🔵 ENTORNO: TESTNET — build/.env.testnet — fapi: testnet.binancefuture.com
```

**Producción — mostrar alerta y esperar confirmación explícita:**
```
🔴 ENTORNO: PRODUCCIÓN — build/.env — fapi: fapi.binance.com
⚠️  ALERTA: estamos por ejecutar una orden con dinero real.
    Par: XXXUSDT | Tipo: SELL SHORT LIMIT | Precio: $X.XX | Qty: XX
    Confirmás? (sí / no)
```

Esta alerta se muestra **siempre** antes de producción, aunque el usuario ya haya confirmado la estrategia.

**Excepciones — NO pedir confirmación:**
1. **Ojo de Halcón activo** — ejecución 100% autónoma, usuario no está disponible. Reportar cada paso en el chat pero jamás preguntar.
2. **Permiso explícito puntual** — el usuario dijo explícitamente "ejecutá sin preguntar" para esa operación en esa sesión.

### Orden de ejecución

1. Declarar entorno (🔵 testnet / 🔴 producción + alerta)
2. Esperar confirmación del usuario si es producción
3. Claude coloca todas las LIMIT entries
4. Claude coloca SL via AlgoOrder **solo después que entre la 1era orden** (error -2022 si no hay posición)
5. Claude coloca TP y Trailing Stop via AlgoOrder
6. Registrar en watchlist

### Formato de presentación

```
═══════════════════════════════════════════════════
 CLAUDE EJECUTA (via API)
═══════════════════════════════════════════════════
  • Entrada 1: LIMIT [SELL/BUY] @ $X.XX — qty XX
  • Entrada 2: LIMIT [SELL/BUY] @ $X.XX — qty XX
  • SL: STOP_MARKET @ $X.XX (via AlgoOrder)
  • TP1: TAKE_PROFIT_MARKET @ $X.XX (via AlgoOrder)
  • TS: TRAILING_STOP_MARKET activación $X.XX callback 6% (via AlgoOrder)

═══════════════════════════════════════════════════
 VOS CONFIGURÁS MANUALMENTE (solo si AlgoOrder falla)
 → Futures → Positions → [PAR] → Edit
═══════════════════════════════════════════════════
  ① Stop Loss (Stop Market): $X.XX
  ② Trailing Stop:
       Activación: $X.XX
       Callback:   6%
═══════════════════════════════════════════════════
```

### Durante la operación

- Claude verifica precio y estado cuando el usuario lo consulta
- Si el precio se acerca al nivel de riesgo → Claude avisa y propone cerrar con MARKET
- Si SL o TS activa → Claude recuerda cancelar entradas pendientes desde la UI
- El usuario siempre decide la acción final

→ Ver lecciones relacionadas: [lecciones.md#ejecucion-tecnica](lecciones.md#ejecucion-tecnica)

---

## Monitor automático — Script de seguimiento (loop)

### Qué es

`scripts/monitor.cjs` — script Node.js que consulta la API de Binance cada vez que se ejecuta y detecta señales de entrada o invalidación. Claude lo corre cada minuto via cron cuando el usuario pide monitoreo continuo.

### Cómo activarlo

El usuario dice: **"enciende loop XXXUSDT"** o **"monitorea XXXUSDT"**

Claude crea un cron de 1 minuto con:
```
node "d:\PROGRAMACION\binance bot\binance-mcp\scripts\monitor.cjs"
```

Variables de entorno configurables:
```
SYMBOL=XXXUSDT RSI_MIN=35 VOL_MIN=5 PRICE_MIN=6.00 STOP=5.80 TP=6.70 SL=5.75
```

### ¿Pide confirmación?

**No** — el path exacto está en `.claude/settings.jsonc` bajo `permissions.allow`. Claude Code auto-permite ese comando sin pedir confirmación al usuario.

Si el script da error de módulo (ES module vs CommonJS), usar siempre la extensión **`.cjs`**, no `.js`.

### Condiciones que reporta

| Salida | Significado | Acción |
|---|---|---|
| línea con datos | Sin señal — seguir esperando | Nada |
| `🟢🟢 SEÑAL LONG` | Todas las condiciones cumplidas | Notificar al usuario urgente |
| `🔴 INVALIDADO` | Precio rompió el stop | Notificar + cancelar cron |

### Condiciones default (long rebote)
1. RSI 15m cruza por encima de 35
2. Última vela 15m cierra verde
3. Volumen última vela > 5M USDT
4. Precio sosteniendo por encima del PRICE_MIN

### Cómo detenerlo

Usuario dice: **"para el loop"** → Claude ejecuta `CronDelete <job_id>`.
