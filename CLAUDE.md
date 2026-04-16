# CLAUDE.md — Cerebro del Sistema de Trading

Este archivo es leído automáticamente al inicio de cada sesión.
Contiene todo el contexto necesario para operar sin explicaciones previas.

---

## Quién es el usuario

Trader conservador con experiencia en grid bots de futuros en Binance.
Conoce bien la mecánica de los grids pero delega el análisis técnico y la
estructuración de estrategias a Claude. No es experto en indicadores pero
entiende los conceptos cuando se explican con claridad. Toma decisiones finales
siempre él — Claude analiza, propone y ejecuta solo con confirmación explícita.

---

## El sistema — Dos pilares

### Pilar 1 — Grids conservadores (capital principal)
- **Objetivo:** ingresos estables y recurrentes en mercados laterales
- **Instrumento:** Futuros USD-M en Binance, grid neutral
- **Parámetros base:** ~60 grids, ~1% entre niveles, rango amplio (30-40%), leverage 3x, margen aislado
- **Capital:** se va acumulando mes a mes; nuevas oportunidades o refuerzo de bots existentes según el mercado
- **Criterio de entrada:** mercado lateral confirmado, precio en zona media del rango, sin catalizadores macro pendientes
- **Regla clave:** los grids se crean desde la UI de Binance (API no disponible para esto). Claude ayuda a calcular parámetros y detectar el momento.

### Pilar 2 — Estrategias activas (capital de riesgo ~$100-200)
Dos sub-tipos:

**A) Shorts en monedas pumpeadas**
- Monedas que suben 100-300%+ en un día sin fundamento
- Horizonte: 1 a 1.5 días máximo
- Entrada: desde el pico, en la primera bajada fuerte confirmada
- Estructura: short grid con limit orders escalonadas + trailing stop o stop fijo
- Señales: RSI > 80, MACD sobreextendido, funding rate muy positivo, volumen cayendo en el pico

**B) Longs en altcoins pequeñas con señales de arranque**
- Monedas de bajo volumen con RSI cruzando al alza, MACD girando positivo
- Objetivo: capturar el inicio de un movimiento antes de que explote
- Estructura: entrada escalonada con limit orders + trailing stop (sin TP fijo)
- Señales: volumen creciendo, RSI saliendo de zona 30-45, MACD cruzando 0

---

## Bots activos actualmente

| Par | Estado | Parámetros | Iniciado | Notas |
|---|---|---|---|---|
| SOLUSDT | ✅ Activo | Neutral 3x, rango $68–$110, 60 grids, stop $65, 1,000 USDT | 13 Abr 2026 | Precio en zona media del rango (~39%) |
| XRPUSDT | ✅ Activo | Neutral 3x, rango $1.10–$1.75, 60 grids, stop $1.05, 1,000 USDT | 13 Abr 2026 | Precio en zona media del rango (~44%) |
| BNBUSDT | ⛔ Cerrado | — | — | Rendimiento inferior. Capital reasignado a XRP y SOL. |

---

## Flujo de trabajo diario

### Consulta diaria de estado ("¿cómo están los bots?" / "¿cómo está la situación?")

Cuando el usuario pide el estado general, responder con este formato en orden:

```
1. BOTS ACTIVOS
   Por cada bot: precio actual | posición en rango (%) | distancia a límites | PNL estimado

2. ALERTAS TÉCNICAS
   ¿Algún bot está al <15% de un límite? → avisar con acción sugerida
   ¿Funding rate se volvió negativo en alguno? → avisar

3. CONTEXTO FUNDAMENTAL
   Buscar noticias recientes de cada par (WebSearch)
   Eventos clave próximos: regulación, ETFs, upgrades, fechas macro (FOMC, CPI)
   Señal: ¿la noticia confirma lateralización o introduce riesgo de ruptura?

4. VEREDICTO
   ✅ Todo en orden — no hacer nada
   ⚠️ Atención en [par] por [motivo técnico/fundamental]
   🔴 Acción sugerida: [qué hacer]
```

Esta consulta combina técnico + fundamental. Sin noticias relevantes → decirlo explícitamente.

### Filtro de capital (ejecutar SIEMPRE al inicio de cada análisis)
Antes de analizar candidatos, consultar el balance disponible real:
- Obtener `availableBalance` de `/fapi/v2/balance`
- Calcular precio mínimo de coin viable: `precio_min = 1000 / (capital * 3)` (asumiendo 3x leverage)
- Descartar automáticamente cualquier coin donde `precio_actual < precio_min` — el usuario no llegaría al mínimo de la UI móvil de Binance para colocar el SL manual
- Mostrar el capital disponible al inicio del reporte para que el usuario tenga contexto

### Consulta de oportunidades ("¿qué encontrás hoy?")
Cuando el usuario pide un escaneo de mercado, el proceso es:

1. **Obtener tickers + exchangeInfo en paralelo** — cruzar ambos para filtrar solo `status=TRADING`. La API de tickers devuelve también contratos en SETTLING que no se pueden operar y no aparecen en la UI del usuario.
2. **Filtrar candidatos:**
   - Pumpeadas: cambio 24h > 20%, volumen > $5M
   - Laterales para grid: cambio 24h entre -3% y +3%, volumen > $10M
   - Señales alcistas: cambio 24h positivo, volumen creciendo (comparar con promedio)
3. **Analizar los candidatos filtrados** en detalle: RSI, MACD, funding rate, ATR, orderbook
4. **Reportar con radar honesto** — clasificar cada candidato como: ✅ setup claro / ⚠️ señales mixtas / ❌ no operar aún

### Investigación profunda antes de proponer cualquier trade (OBLIGATORIO)

El filtrado inicial solo identifica candidatos. Antes de proponer una estrategia concreta, investigar:

**Para shorts en pumps:**
1. ¿Por qué subió? Buscar si hay catalizador real (listing, narrativa, noticias)
2. ¿En qué fase está el pump? (arranque / aceleración / agotamiento) — ver volumen por vela
3. ¿El volumen está CAYENDO en el pico? Si sigue alto, el pump tiene combustible
4. ¿El funding es POSITIVO? Si es negativo → shorts ya están entrando → riesgo de squeeze → NO operar
5. ¿Qué hicieron pumps similares (misma moneda u otras) en los últimos 30 días?
6. ¿Hay divergencia bajista en RSI 1h? (precio sube pero RSI hace máximos más bajos)

**Semáforo de funding rate (crítico — aprendido en BIOUSDT con -$40 de pérdida):**
- Funding > +0.05% → ✅ longs pagando, sobreextensión alcista real → apto para short
- Funding entre -0.05% y +0.05% → ⚠️ neutro → analizar resto de señales
- Funding < -0.05% → ❌ shorts pagando, mercado ya apostó a la baja → riesgo de squeeze → NO shortear

**IMPORTANTE — siempre consultar DOS fuentes de funding, no una:**
1. `lastFundingRate` en `/fapi/v1/premiumIndex` = último período cobrado. Puede estar desactualizado hasta 8hs.
2. Historial reciente en `/fapi/v1/fundingRate?limit=3` = los últimos 3 períodos. Muestra la **tendencia real** del funding.
- Si el historial muestra -0.001% → -0.048% → -0.089% = funding empeorando rápido aunque el `lastFundingRate` parezca bajo.
- El valor proyectado exacto que ve el usuario en la app NO está disponible en la API pública.
- **Workaround:** usar la tendencia de los últimos 3 períodos como proxy. Si todos son negativos y crecientes → situación peor de lo que el último valor sugiere.
- Ejemplo real (ORDIUSDT 2026-04-16): tendencia -0.001% → -0.048% → -0.089% | app muestra actual: -0.089%, próximo proyectado: -0.021% → squeeze activo pero aliviándose.

**Output del análisis — formato estándar a usar siempre:**

```
💰 Capital disponible: $XX USDT

🔴 NO OPERAR ahora:
  XXXUSDT +120% — funding negativo (-0.08%), squeeze activo
  YYYUSDT +80%  — volumen subiendo, pump sin agotamiento

⚠️ EN RADAR (señales mixtas o requiere más capital):
  ZZZUSDT +65% — funding ✅ pero volumen aún no cae
                  Requiere $XX para mínimo UI — podés agregar fondos si querés

✅ SETUP VÁLIDO — propongo 2 estrategias:
  WWWUSDT +90% — funding ✅ +0.19%, volumen cayó 70%, confirmación bajista activa
  [A] Conservadora: ...
  [B] Agresiva: ...
```

Claude NO elige por el usuario. Si no hay setup válido → decirlo claramente y explicar qué falta ver.

### Seguimiento de monedas watchlist
Ver `docs/mercado/watchlist.md` — se actualiza en cada sesión cuando hay cambios relevantes.

### Protocolo operativo
Antes de cualquier ejecución con capital real seguir el flujo de 5 pasos
documentado en `docs/protocolo-operativo.md`:
1. Análisis de mercado → 2. Diseño de estrategia → 3. Validación testnet
→ 4. Revisión final → 5. Ejecución híbrida

Comando testnet: `node testnet-validator.js` desde la raíz del proyecto.

### Modelo de ejecución híbrido (IMPORTANTE)
Toda estrategia se presenta dividida en DOS bloques:
- **CLAUDE EJECUTA**: entradas LIMIT + Take Profit LIMIT + cierres MARKET
- **USUARIO HACE MANUALMENTE**: Stop Loss, Trailing Stop, OCO — desde UI de Binance
  (Futures → posición abierta → editar SL/TP o activar trailing)

Claude NO ejecuta su parte hasta que el usuario confirma que entendió ambas partes.
Ver formato exacto en `docs/protocolo-operativo.md` → Paso 5.

### Ejecución de órdenes
- Siempre mostrar la estructura completa antes de ejecutar
- Esperar confirmación explícita del usuario ("ok", "ejecuta", "adelante")
- Nunca ejecutar por iniciativa propia
- Usar siempre timestamp del servidor Binance (no del sistema local)
- La cuenta tiene **Hedge Mode activo** — todas las órdenes de futuros requieren `positionSide: LONG` o `SHORT`

---

## Capacidades técnicas confirmadas

### Disponible via API (funciona)
| Acción | Endpoint | Estado |
|---|---|---|
| Escanear todos los tickers futuros | `/fapi/v1/ticker/24hr` | ✅ |
| Precio, klines, funding, orderbook | `/fapi/v1/...` | ✅ |
| Crear orden LIMIT en futuros | `/fapi/v1/order` | ✅ Validado |
| Crear STOP_MARKET, TAKE_PROFIT, TRAILING_STOP | `/fapi/v1/order` | ❌ Error -4120 (validado testnet + real) |
| Cancelar órdenes | `/fapi/v1/order` DELETE | ✅ Validado |
| Ver órdenes abiertas y balance | `/fapi/v2/...` | ✅ Validado |

### No disponible via API (solo desde UI de Binance)
| Acción | Motivo |
|---|---|
| Crear grid de futuros | Endpoint no público (404) |
| TWAP / VP en futuros | Endpoint no público (404) |
| Ver grids activos creados desde UI | No expuesto en API |

### Consideraciones técnicas
- `MIN_NOTIONAL` ETHUSDT futuros: $20 USDT por orden
- Hedge Mode activo: siempre incluir `positionSide`
- Timestamp: siempre tomar de `/fapi/v1/time`, no del sistema local
- Keys en: `build/.env` (BINANCE_API_KEY, BINANCE_API_SECRET)
- Para ejecutar: `cd build && node -e "..."` con dotenv cargado
- **Doble mínimo a verificar siempre antes de proponer un trade:**
  - Mínimo API (`MIN_NOTIONAL` en exchangeInfo): generalmente $5 — lo que Claude puede ejecutar
  - Mínimo UI Binance (app móvil): puede ser ~$1,000 notional en coins de precio muy bajo
  - Si el usuario no llega al mínimo UI → no puede colocar el SL manual → trade inviable
  - Verificar: `qty_minima_UI = ~1000 / precio_actual` y comparar con capital disponible

---

## Reglas del sistema

0.5 **ANTES DE PROPONER UN TRADE — investigación completa, no solo filtrado**
   - Funding negativo en un pump = NO proponer short. Sin excepción. (Lección BIOUSDT: -$40)
   - Siempre presentar mínimo 2 opciones + la opción "no operar"
   - Si hay señales contradictorias → decirlo y no recomendar
   - El análisis debe responder: ¿por qué subió? ¿en qué fase está? ¿el volumen confirma agotamiento?

0. **NO usar órdenes condicionales con capital real** — STOP_MARKET, STOP, TAKE_PROFIT, TRAILING_STOP dan error -4120 en `/fapi/v1/order` (validado en testnet y real). Solo LIMIT y MARKET funcionan. Workaround: cerrar con MARKET manual. Ver `api-reference/capacidades-mcp.md`
1. **Nunca ejecutar sin confirmación** — proponer siempre, ejecutar solo cuando el usuario lo indica
2. **Análisis antes que ejecución** — siempre revisar precio, RSI, MACD, funding y ATR antes de proponer
3. **Documentar todo** — cada estrategia nueva, cada aprendizaje, cada cambio va a docs/
4. **Watchlist viva** — actualizar `docs/mercado/watchlist.md` cuando se identifiquen oportunidades o cambios
5. **Capital conservador primero** — el Pilar 1 es la base; el Pilar 2 es oportunista con capital limitado
6. **Parámetros base grids:** 60 grids, ~1% entre niveles, 3x leverage, margen aislado, rango 30-40%
7. **Stop en grids:** no usar stop automático — cerrar con orden límite cuando el precio aún está en rango

---

## Estructura de documentación

```
/
├── CLAUDE.md                              ← Este archivo (leer siempre)
├── build/                                 ← Servidor MCP compilado
├── docs/
│   ├── README.md                          ← Índice general
│   ├── mercado/
│   │   └── watchlist.md                   ← Monedas en seguimiento activo
│   ├── estrategias/
│   │   ├── estrategias-limit-orders.md    ← 5 estrategias con órdenes disponibles
│   │   ├── grid-futuros-conservador.md    ← Estrategia base Pilar 1
│   │   ├── twap-acumulacion-grid.md       ← Adaptación TWAP → LIMIT orders
│   │   ├── flujo-consulta-general.md      ← Protocolo de análisis diario
│   │   └── ordenes-algo-twap-vp.md        ← Referencia órdenes (TWAP no disponible)
│   └── api-reference/
│       └── capacidades-mcp.md             ← Qué funciona y qué no en la API
```
