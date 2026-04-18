# Ojo de Halcón — Estrategia de Ejecución Autónoma

> **También conocida como:** auto trade, AutoSniper
>
> ⚠️ **ADVERTENCIA CRÍTICA:**
> Esta estrategia ejecuta órdenes en **PRODUCCIÓN con dinero real** sin intervención humana.
> Una vez activada, Claude monitorea, decide y ejecuta de forma autónoma.
> Solo activar si se entiende y acepta este comportamiento.

---

## Concepto

Agente autónomo de vigilancia y ejecución. Monitorea un símbolo en ciclo lento, detecta el setup exacto, escala a ciclo rápido y ejecuta el ciclo completo de entrada + protecciones sin que el usuario tenga que confirmar nada.

El usuario define las condiciones de entrada antes de activar. A partir de ahí, Claude actúa solo.

---

## Arquitectura del ciclo

```
[PASO 0 — PRE-ACTIVACIÓN OBLIGATORIA]
  Usuario ejecuta /compact en Claude Code ANTES de confirmar la activación.
  → Libera contexto para que Ojo de Halcón opere sin riesgo de compactación
     automática en medio de la ejecución.
  → Claude no procede con la activación hasta que el usuario confirme que hizo /compact.

[PASO 1 — ACTIVACIÓN]
  Claude edita .claude/settings.jsonc
  → Agrega al allow: BinanceCustomFuturesNewOrder,
                     BinanceCustomFuturesAlgoOrder,
                     BinanceCustomFuturesCancelAlgoOrder
  Usuario recarga Claude Code (Ctrl+Shift+P → Reload Window)
  → A partir de ahí las órdenes se ejecutan sin popup

[FASE 1 — VIGILANCIA]
  Cron cada 5 min — durable: true (sobrevive reinicios de Claude Code)
  → Analiza símbolo con BinanceCustomFuturesAnalyze
  → Evalúa condiciones de setup
  → Si NO se cumplen: reporta 1 línea y espera
  → Si SE CUMPLEN: pasa a Fase 2

  ⚠️ El prompt del cron debe ser 100% autocontenido:
     incluir símbolo, condiciones, capital y acciones a tomar.
     No puede asumir contexto previo — en sesiones largas el historial se comprime.

[FASE 2 — EJECUCIÓN]
  Elimina cron de 5 min
  Crea cron de 30 seg
  → En el primer disparo: ejecuta entrada MARKET
  → Coloca SL + TP1 + TP2 automáticamente via AlgoOrder API
  → Elimina cron de 30 seg
  → Reporta resultado completo al usuario

[PASO FINAL — DESACTIVACIÓN]
  Claude edita .claude/settings.jsonc
  → Remueve los 3 permisos de ejecución del allow
  → Permisos vuelven al estado normal (solo lectura)
```

---

## Parámetros del setup SHORT (estrategia A — pumps)

| Señal        | Condición de entrada | Por qué                                            |
| ------------- | --------------------- | --------------------------------------------------- |
| RSI 1h        | < 85                  | RSI extremo = sobreextensión, empieza a normalizar |
| Funding rate  | > 0% (positivo)       | Longs pagando = presión vendedora estructural      |
| Vela 15m roja | Volumen > 5M coins    | Confirmación de momentum bajista con liquidez real |

**Las tres condiciones deben cumplirse simultáneamente.** Una sola no alcanza.

---

## Ejecución de órdenes

```
① SELL MARKET — entrada completa de una vez
② STOP_MARKET (SL)        — 8% por encima del entry, closePosition: true
③ TAKE_PROFIT_MARKET (TP1) — -15% del entry, 50% de la posición (quantity)
④ TAKE_PROFIT_MARKET (TP2) — -25% del entry, closePosition: true
```

- Leverage: **3x**
- Margen: **ISOLATED**
- Capital por operación: definido al activar (típico $100–$150)
- positionSide: **SHORT** (cuenta en Hedge Mode)

---

## Aprendizajes del test (2026-04-17)

- `closePosition: true` en AlgoOrder se auto-cancela cuando se cierra la posición — no necesita cancelación manual
- `closePosition: false` con `quantity` fija sí requiere cancelación manual si se cierra la posición por otra vía
- `BinanceCustomFuturesCancelAlgoOrder` requiere `symbol` además del `algoId` — pasar siempre ambos
- El ciclo completo cron 1min → 30s → MARKET → AlgoOrders funciona end-to-end en producción

---

## Mejoras futuras (pendientes)

- Trailing Stop como salida principal en lugar de TP fijo — captura tendencias largas
- Entrada escalonada (2-3 LIMIT en cascada) en lugar de MARKET puro — mejor precio promedio
- Tamaño dinámico según ATR o volatilidad del símbolo
- Setup LONG simétrico (condiciones de momentum alcista)
- Alerta al usuario vía log cuando se ejecuta — para revisión post-operación

---

## Activación

Para activar Ojo de Halcón en una sesión:

```
"Activá Ojo de Halcón en [SÍMBOLO] — estrategia [A/LONG] — capital $[X]"
```

Claude crea el cron, define las condiciones y ejecuta autónomamente.
No se necesita ninguna confirmación adicional hasta que Claude reporte el resultado.

> **Nota operativa:** Cuando Ojo de Halcón está activo, el usuario NO está disponible.
> Claude reporta cada paso aquí mismo (en el chat) pero NO hace preguntas ni espera respuesta.
> Cualquier consulta bloquearía la estrategia por completo — está prohibido preguntar durante la ejecución.
