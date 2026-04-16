# Protocolo Operativo — Del Análisis a la Ejecución

> Este documento define el proceso estándar completo para evaluar, validar
> y ejecutar cualquier estrategia. Seguirlo garantiza que nunca se opere
> con capital real sin haber validado cada paso antes.
>
> Última actualización: 2026-04-16

---

## El flujo completo en 5 pasos

```
1. ANÁLISIS DE MERCADO
       ↓
2. DISEÑO DE ESTRATEGIA
       ↓
3. VALIDACIÓN EN TESTNET
       ↓
4. REVISIÓN Y AJUSTE
       ↓
5. EJECUCIÓN EN PRODUCCIÓN
```

---

## Paso 1 — Análisis de mercado

**Cuándo:** cuando el usuario pide un escaneo o quiere evaluar un símbolo.

**Qué hace Claude:**
1. Obtener todos los tickers de futuros (`/fapi/v1/ticker/24hr`)
2. Filtrar candidatos por categoría:
   - **Pumpeadas** (short): cambio 24h > 20%, volumen > $3M
   - **Laterales** (grid): cambio 24h entre -3% y +3%, volumen > $20M
   - **Con momentum** (long): volumen creciendo, cambio positivo moderado
3. Para cada candidato filtrado, analizar en detalle:
   - RSI en 1h y 4h
   - MACD en 1h
   - ATR 4h (volatilidad)
   - Funding rate últimas 8 lecturas → **ver checklist de shorts abajo**
   - Orderbook ratio bid/ask
   - Klines diarios últimos 14 días
   - Volumen en el pico: ¿está cayendo (agotamiento) o sigue subiendo?

**Output esperado:** tabla clasificada con oportunidades y tipo de estrategia sugerida.
Claude presenta **mínimo 2 opciones de estrategia** para que el usuario elija — nunca una sola propuesta.

### ⛔ Checklist de VETO para shorts en pumps — en este orden exacto

**Paso 0 — Capital (primero siempre):**
- Consultar `availableBalance` en `/fapi/v2/balance`
- Calcular si el precio de la coin supera `1000 / (capital × 3)` — si no, mencionarla igual pero aclarar que requiere más fondos
- Si capital < $20 → no hay trade posible, informar al usuario

**Pasos 1-5 — Solo si el capital es suficiente:**

| Condición | Señal requerida | Por qué |
|---|---|---|
| Funding rate | **Debe ser positivo** (> +0.05%) | Negativo = mercado ya está short = riesgo de squeeze. Aprendido en BIOUSDT: funding -0.82% y el precio siguió subiendo +15% |
| Volumen en el pico | **Debe estar cayendo** vs velas anteriores | Si el volumen sigue alto, el pump no terminó |
| RSI 1h | Debe mostrar divergencia bajista o estar > 85 **y cayendo** | RSI alto solo no alcanza si el momentum sigue |
| MACD 1h | Debe estar girando o cruzando a la baja | MACD positivo creciente = pump activo |
| Distancia desde mínimos | Pump debe ser ≥ 100% desde el inicio | Pumps menores tienen más probabilidad de continuar |

**Si el funding es negativo → el mercado ya apostó contra el precio. Short squeeze activo. No operar short.**

### 📊 Leer la fase del pump en velas 4h

Antes de entrar short, identificar en qué fase está el pump:

```
Fase 1 — Arranque:    vela 4h verde +20%/+30%, volumen creciendo → NO shortear
Fase 2 — Aceleración: vela 4h verde +10%/+20%, volumen alto     → NO shortear
Fase 3 — Agotamiento: vela 4h pequeña o roja, volumen cayendo   → EVALUAR short
Fase 4 — Corrección:  vela 4h roja -10%/+20%, volumen medio     → ESPERAR rebote
Fase 5 — Rebote:      vela 4h verde con poco volumen            → EVALUAR: si RSI
                                                                    sube a >75 acá
                                                                    → short en el techo
```

Shortear en Fase 4 o 5 sin RSI alto = entrar en corrección normal, no en reversión.
El mejor momento es cuando el rebote de Fase 5 lleva el RSI de vuelta a >75-80 con volumen bajo.

### ✅ Definición de "confirmación bajista" (cuándo se puede entrar)

No entrar solo porque el precio baja un poco. Confirmación requiere **al menos 2 de estos 3**:
1. **2 velas 15m consecutivas en rojo** con cierre por debajo de la apertura anterior
2. **Volumen en las velas rojas ≥ volumen promedio** de las últimas 4 velas (presión vendedora real)
3. **Precio rompe un soporte claro** — mínimo de la última hora o zona de consolidación previa

Una sola vela roja no es confirmación. El usuario apurado siguiendo el precio = señal de esperar.

---

## Paso 2 — Diseño de estrategia

**Cuándo:** después de identificar un candidato concreto **y haber pasado el checklist de veto del Paso 1.**

**Regla nueva (aprendida en BIOUSDT, 2026-04-16):**
Claude presenta **siempre mínimo 2 estrategias alternativas** con sus pros/contras. El usuario elige.
Nunca proponer una sola opción como si fuera la única posible.

**Estructura mínima que Claude debe definir por cada estrategia:**

```
Par:              XXXUSDT
Tipo:             Long / Short / Neutral
Capital:          $XX USDT
Leverage:         Xx
Exposición total: $XX USDT

Entradas (LIMIT orders):
  Orden 1: precio, cantidad, % del capital
  Orden 2: ...

Cierre con ganancia (LIMIT orders):
  TP1: precio, % de la posición a cerrar
  TP2: ...

Stop loss (LIMIT order monitoreada):
  Stop: precio, acción = cerrar con MARKET si se acerca

Precio de invalidación: si llega a $XX la tesis es incorrecta
Pérdida máxima estimada: $XX USDT (XX% del capital)
```

**Regla:** Claude no propone sin estos datos completos.
**Regla:** el usuario confirma explícitamente antes de pasar al paso 3.
**Regla de precios para entradas SHORT:**
- Las entradas SELL LIMIT deben estar **por encima o en** el precio actual para que queden pendientes
- Si el precio límite es MENOR que el precio de mercado → Binance ejecuta inmediatamente (como MARKET)
- Para entradas escalonadas SHORT: precio actual + escalones hacia ARRIBA (esperando spike)
- O bien: 1 entrada MARKET inmediata + resto LIMIT más abajo para promediar si baja más
**Regla de margen:** siempre verificar que la cuenta esté en modo **Isolated** para la posición, nunca Cross.

---

## Paso 3 — Validación en testnet

**Cuándo:** al configurar el sistema por primera vez, o si hay un error inesperado en producción.
**NO es obligatorio antes de cada operación individual** — los tipos de orden válidos (LIMIT/MARKET) ya están validados. Solo correrlo si Binance anuncia cambios en su API o aparece un error nuevo.
**Comando:** `node testnet-validator.js` desde la raíz del proyecto.

### 3a — Validar endpoints a usar

El validador prueba todos los tipos de órdenes. Resultado esperado actual:

| Tipo | Estado esperado |
|---|---|
| LIMIT | ✅ Funciona |
| MARKET | ✅ Funciona |
| STOP_MARKET | ❌ -4120 (bloqueado por Binance) |
| TAKE_PROFIT_MARKET | ❌ -4120 (bloqueado por Binance) |
| TRAILING_STOP_MARKET | ❌ -4120 (bloqueado por Binance) |

Si algún resultado cambia → actualizar `docs/api-reference/capacidades-mcp.md`.

### 3b — Simular la estrategia en testnet

Ejecutar las órdenes exactas de la estrategia pero en testnet:
- Mismos precios, mismas cantidades, mismo leverage
- Verificar que todas las órdenes se crean correctamente
- Verificar que los precios y cantidades respetan los filtros del símbolo

**Solo si el 3b pasa sin errores → avanzar al paso 4.**

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

El sistema opera en modo **híbrido**: Claude ejecuta lo que puede via API,
el usuario ejecuta manualmente lo que Binance bloquea en la API pública.

### Lo que Claude ejecuta automáticamente
| Acción | Tipo de orden | Estado |
|---|---|---|
| Entradas escalonadas | LIMIT | ✅ Claude lo hace |
| Take Profit | LIMIT | ✅ Claude lo hace |
| Cierre de emergencia | MARKET | ✅ Claude lo hace si el usuario lo pide |

### Lo que el usuario hace manualmente en la UI de Binance
| Acción | Por qué manual | Cómo hacerlo |
|---|---|---|
| Stop Loss automático | STOP_MARKET bloqueado (-4120) | Futures UI → posición → Add SL/TP |
| Trailing Stop | TRAILING_STOP bloqueado (-4120) | Futures UI → posición → Trailing Stop |
| OCO (TP+SL juntos) | Endpoint no existe en futuros | Futures UI → posición → OCO order |
| Grid bots | Endpoint no público | Futures UI → Bot Trading → Grid |

### Protocolo de comunicación en cada estrategia

Cuando Claude presenta una estrategia, la divide en dos secciones claras:

```
═══════════════════════════════════════
 CLAUDE EJECUTA (via API)
═══════════════════════════════════════
  • Entrada 1: LIMIT SELL @ $X.XX
  • Entrada 2: LIMIT SELL @ $X.XX
  • Take Profit: LIMIT BUY @ $X.XX

═══════════════════════════════════════
 VOS HACÉS MANUALMENTE (UI Binance)
═══════════════════════════════════════
  • Stop Loss: ir a Futures → tu posición
    → Edit → SL @ $X.XX
  • (opcional) Trailing Stop: igual desde
    la UI, activar trailing con X% callback
═══════════════════════════════════════
```

Claude no ejecuta hasta que el usuario confirma que entendió ambas partes.

### Protocolo de entorno — declarar SIEMPRE antes de ejecutar

El usuario se guía por esto para saber si es simulación o dinero real.

**Testnet:**
```
🔵 ENTORNO: TESTNET — build/.env.testnet
```

**Producción — mostrar alerta y esperar confirmación explícita:**
```
🔴 ENTORNO: PRODUCCIÓN — build/.env — dinero real
⚠️  ALERTA: estamos por ejecutar una orden con dinero real.
    Par: XXXUSDT | Tipo: SELL SHORT LIMIT | Precio: $X.XX | Qty: XX
    Confirmás? (sí / no)
```

Esta alerta se muestra **siempre** antes de producción, aunque el usuario ya haya
confirmado la estrategia. Es la última verificación antes de tocar capital real.

### Orden de ejecución
1. Declarar entorno (🔵 testnet / 🔴 producción + alerta)
2. Esperar confirmación del usuario si es producción
3. Claude coloca todas las LIMIT entries
4. Claude coloca el/los LIMIT de Take Profit **solo después que llene alguna entrada** (lección ORDI: -2022 en Hedge Mode si no hay posición abierta)
5. Claude informa al usuario qué debe hacer manualmente (SL desde UI)
6. Usuario confirma que colocó el SL manual
7. Registrar en watchlist

### Durante la operación
- Claude verifica precio y estado cuando el usuario lo consulta
- Si el precio se acerca al nivel de riesgo → Claude avisa y propone cerrar con MARKET
- El usuario siempre decide la acción final

---

## Limitaciones conocidas del sistema (a 2026-04-16)

| Limitación | Impacto | Workaround |
|---|---|---|
| STOP_MARKET no disponible via API | No hay stop automático | Stop manual con LIMIT monitoreado |
| Grids de futuros no disponibles via API | No crear grids desde Claude | Crear desde UI de Binance |
| TWAP/VP de futuros no disponibles | No entradas graduales automáticas | Múltiples LIMIT escalonados |
| Hedge Mode en cuenta real | Todas las órdenes requieren `positionSide` | Siempre incluir LONG/SHORT |
| Testnet en One-way Mode | Scripts deben adaptarse al modo | Detectar modo antes de enviar órdenes |

---

## Cuándo correr el validador

- **Siempre** antes de ejecutar una estrategia nueva con capital real
- Cuando Binance anuncia cambios en su API
- Si aparece un error inesperado en producción
- Al inicio de una sesión donde se planee operar (tarda ~15 segundos)
