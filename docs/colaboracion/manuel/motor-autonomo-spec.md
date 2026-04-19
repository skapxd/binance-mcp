# Spec Técnica — Motor Autónomo de Trading

> **Destino:** Manuel (backend / infra)
> **Contexto:** Claude Code corre las estrategias hoy, pero el contexto se agota en ~30-40 min con ciclos de 1min. Necesitamos un motor externo que maneje el loop de vigilancia y delegue la decisión a Claude cuando el mercado esté listo.
> **Referencia arquitectura:** ver también `../sync-para-manuel.md` para las preguntas de infra pendientes.
> **Última actualización:** dos variantes de arquitectura documentadas — Variante A (Claude API desde Lambda) y Variante B (RemoteTrigger hacia Claude Code en VS Code).

---

## El problema que resuelve esto

Hoy las estrategias corren como cron dentro de Claude Code. Cada ciclo acumula tokens en el contexto hasta que se agota. No es viable para sesiones de horas sin supervisión.

**Solución:** Lambda (o servicio dedicado) corre el 95% del trabajo. Claude API solo se invoca cuando todas las condiciones de entrada pasan — con contexto fresco cada vez, sin acumulación.

---

## Mecanismos de integración Claude Code — Investigado

Hay dos features de Claude Code (ambas en research preview) según arquitectura deseada:

| Mecanismo | Qué hace | Para qué variante |
|---|---|---|
| **Routines API** (`/fire`) | Lambda dispara una Routine en la nube de Anthropic | Variante A — autónomo sin VS Code |
| **Channels** | Lambda pushea mensajes a una sesión activa en VS Code | Variante B — Diego ve el chat |

---

## Variante A — Lambda llama a Claude API vía Routines (autónomo completo)

```
[Cron cada 1min — Lambda FASE 1]
  → Llama a Binance directamente (sin Claude)
  → Evalúa condiciones de la estrategia activa
  → Si ALGUNA falla → solo log, terminar ciclo
  → Si TODAS pasan → llamar a Claude API con snapshot del mercado
      → Claude decide dirección y retorna parámetros de orden en JSON
      → Lambda ejecuta la orden LIMIT en Binance
      → Lambda hace polling cada 10s hasta 60s
      → Si llenó → Claude recibe confirmación → coloca SL + TS via Binance
      → Si no llenó → Lambda cancela orden, vuelve a FASE 1
```

**Cómo implementar con Routines API:**

```javascript
// Lambda — cuando todas las condiciones pasan
async function dispararRoutine(snapshot) {
  const response = await fetch(
    `https://api.anthropic.com/v1/claude_code/routines/${process.env.ROUTINE_ID}/fire`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_ROUTINE_TOKEN}`,
        'anthropic-beta': 'experimental-cc-routine-2026-04-01',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: JSON.stringify(snapshot) })
    }
  );
  // Retorna: { claude_code_session_id, claude_code_session_url }
  return response.json();
}
```

**La Routine en Anthropic cloud debe tener este prompt guardado:**
```
Sos el motor de decisión de Colibrí/Ojo de Halcón. 
Recibís un snapshot JSON del mercado (todas las condiciones ya pasaron).
Parsear el JSON del contexto, determinar dirección, retornar parámetros de orden.
Responder SOLO con JSON: { entrar, direccion, precioEntrada, quantity, slPrice, tsCallback }
```

**Ventaja:** 100% autónomo, no requiere VS Code abierto. Corre 24/7.
**Tradeoff:** Diego no ve la ejecución en el chat — visibilidad solo via CloudWatch + app Binance.

---

## Variante B — Lambda pushea a sesión activa de VS Code vía Channels (híbrido)

```
[Cron cada 1min — Lambda FASE 1]
  → Llama a Binance directamente (sin Claude)
  → Evalúa condiciones
  → Si ALGUNA falla → solo log, terminar ciclo
  → Si TODAS pasan → llama RemoteTrigger de Claude Code
      ↓
[Claude Code — chat de VS Code — contexto fresco]
  → Recibe snapshot del mercado pre-calculado por Lambda
  → Decide dirección (RSI 1m ya calculado, solo interpreta)
  → Ejecuta orden en Binance via MCP tools
  → Reporta resultado en el chat de VS Code
  → Coloca SL + TS
```

**Ventaja:** Diego ve toda la ejecución en el chat de VS Code como hoy. Key de Anthropic queda local. Contexto fresco en cada entrada.
**Tradeoff:** requiere VS Code abierto y sesión de Claude activa. No corre 24/7 sin supervisión.

**❓ Preguntas abiertas para validar (Channels es research preview):**
- ¿Channels está disponible en la cuenta de Diego/Manuel?
- ¿Acepta payload JSON o solo texto plano?
- ¿Hay rate limits en el push desde Lambda?
- Docs de referencia: `https://code.claude.com/docs/en/channels.md`

---

## Variante C — Control operativo (para ambas variantes)

Para activar/pausar/cambiar config sin deployar código:

```
AWS SSM Parameter Store → /trading/config
{
  "activa": true,
  "estrategia": "colibri",
  "symbol": "ENAUSDT",
  "capital": 20,
  "leverage": 10,
  "direccion": "ambas"
}
```

Lambda lee este parámetro al inicio de cada ciclo. Diego cambia el JSON desde AWS Console → efecto en el próximo ciclo (máximo 1 minuto de latencia).

**Ventaja clave:** el 95% de los ciclos son Lambda mirando números. Claude solo corre cuando hay setup real.

---

## Binance API — Endpoints necesarios

Todos son REST sobre `https://fapi.binance.com` (producción futuros USD-M).

### Lectura de mercado

```
GET /fapi/v1/klines
  params: symbol, interval (1m/5m/15m/1h/4h), limit (20)
  → Devuelve array de velas: [openTime, open, high, low, close, volume, ...]

GET /fapi/v1/premiumIndex
  params: symbol
  → fundingRate, nextFundingTime, markPrice

GET /fapi/v2/depth
  params: symbol, limit (20)
  → bids[], asks[] → calcular ratio bid/ask
```

### Cuenta y posiciones

```
GET /fapi/v2/account          → balance USDT, posiciones abiertas
GET /fapi/v1/openOrders       → órdenes abiertas (para verificar fill)
```

### Ejecución de órdenes

```
POST /fapi/v1/order           → orden LIMIT / MARKET
  params: symbol, side, positionSide, type, price, quantity, timeInForce, leverage, marginType

POST /fapi/v1/algoOrder       → SL, TP, Trailing Stop
  params: symbol, side, positionSide, type (STOP_MARKET / TRAILING_STOP_MARKET)
          triggerPrice, callbackRate (TS), closePosition: true

DELETE /fapi/v1/order         → cancelar orden por orderId
DELETE /fapi/v1/algoOrder     → cancelar algo order por algoId
```

**Importante:** la cuenta usa **Hedge Mode** → todas las órdenes requieren `positionSide: "LONG"` o `"SHORT"`.

---

## Integración Claude API

Solo se llama cuando todas las condiciones pasan. El payload incluye el snapshot completo del mercado para que Claude no necesite llamar a Binance por su cuenta.

### Ejemplo de llamado (Node.js / Anthropic SDK)

```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function consultarClaude(estrategia, snapshot) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: `Sos el motor de decisión de la estrategia ${estrategia}. 
Recibís un snapshot del mercado ya validado (todas las condiciones pasaron).
Tu tarea: determinar dirección y retornar parámetros de orden en JSON.
Responde SOLO con JSON válido, sin texto adicional.`,
    messages: [{
      role: 'user',
      content: `Snapshot mercado ENAUSDT:
${JSON.stringify(snapshot, null, 2)}

Retorná JSON con:
{
  "entrar": true/false,
  "direccion": "LONG" | "SHORT",
  "razon": "string corta",
  "precioEntrada": number,
  "quantity": number,
  "slPrice": number,
  "tsCallback": number
}`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### Snapshot que recibe Claude

```javascript
const snapshot = {
  symbol: 'ENAUSDT',
  precio: 0.11935,
  rsi1m: 38.2,        // ya calculado por Lambda
  rsi5m: 51.0,
  rsi15m: 42.5,
  rsi1h: 44.3,
  funding: -0.0007,
  velas15m: [         // últimas 6: [color, pct, volumen]
    { color: 'RED', pct: -0.3, vol: 11500000 },
    { color: 'RED', pct: -0.0, vol: 6300000 },
    { color: 'GREEN', pct: 1.5, vol: 18700000 },
    { color: 'GREEN', pct: 0.2, vol: 17800000 },
    { color: 'RED', pct: -1.1, vol: 8800000 },
    { color: 'RED', pct: -0.7, vol: 11100000 }
  ],
  velas4h: [          // últimas 5
    { color: 'RED', pct: -4.4 },
    { color: 'GREEN', pct: 3.5 },
    { color: 'RED', pct: -4.0 },
    { color: 'GREEN', pct: 0.6 },
    { color: 'RED', pct: -0.4 }
  ],
  high24h: 0.12584,
  low24h: 0.11847,
  capital: 20,
  leverage: 10
};
```

---

## Estrategia 1 — Colibrí (scalping en lateralización)

### Parámetros

```
Par:           pares líquidos (BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT, BNBUSDT, ENAUSDT)
Capital:       $20 USDT por trade
Leverage:      10x (hasta 15x si el par lo permite)
Exposición:    $200 USDT
Margen:        ISOLATED
positionSide:  LONG o SHORT (Hedge Mode)
Max trades:    5 por sesión
```

### Cálculo RSI manual (Lambda lo hace sin Claude)

```javascript
function calcularRSI(closes) {
  // closes: array de 15 precios de cierre (índices 0-14)
  // Calcular 14 cambios
  const cambios = [];
  for (let i = 1; i < closes.length; i++) {
    cambios.push(closes[i] - closes[i - 1]);
  }

  const ganancias = cambios.map(c => c > 0 ? c : 0);
  const perdidas  = cambios.map(c => c < 0 ? Math.abs(c) : 0);

  const avgGain = ganancias.reduce((a, b) => a + b, 0) / 14;
  const avgLoss = perdidas.reduce((a, b) => a + b, 0) / 14;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Uso: pasar los últimos 15 closes del intervalo correspondiente
// Obtener 20 klines → usar closes[5..19] (últimos 15)
```

### Condiciones FASE 1 (todas deben pasar — Lambda evalúa sin Claude)

```javascript
function evaluarCondicionesColibri(datos) {
  const { rsi1h, rsi5m, rsi15m, velas15m, velas4h, funding, high24h, low24h } = datos;

  // 1. RSI 1h en zona neutral
  if (rsi1h < 35 || rsi1h > 65) return { ok: false, fallo: 'RSI 1h fuera de zona' };

  // 2. RSI 5m en zona neutral
  if (rsi5m < 35 || rsi5m > 65) return { ok: false, fallo: 'RSI 5m fuera de zona' };

  // 3. RSI 15m en zona neutral (sin oversold/overbought)
  if (rsi15m < 40 || rsi15m > 60) return { ok: false, fallo: `RSI 15m = ${rsi15m.toFixed(1)} fuera de 40-60` };

  // 4. Rango intradiario mínimo (hay suficiente movimiento para cubrir fees)
  const rango = (high24h - low24h) / low24h * 100;
  if (rango < 3) return { ok: false, fallo: `Rango ${rango.toFixed(1)}% < 3%` };

  // 5. Volatilidad 15m mínima (velas con cuerpo real)
  const volPct = velas15m.map(v => Math.abs(v.pct));
  const avgVol = volPct.reduce((a, b) => a + b, 0) / 6;
  if (avgVol < 0.4) return { ok: false, fallo: `Volatilidad 15m ${avgVol.toFixed(2)}% < 0.4%` };

  // 6. Funding neutro (sin sesgo fuerte)
  if (funding < -0.05 || funding > 0.05) return { ok: false, fallo: 'Funding extremo' };

  // 7. Volumen mínimo por vela 15m
  const volUSDT = velas15m.map(v => v.vol);
  const avgVolUSDT = volUSDT.reduce((a, b) => a + b, 0) / 6;
  if (avgVolUSDT < 1_000_000) return { ok: false, fallo: 'Volumen insuficiente' };

  // 8. Sin spike de volumen (último < 2x promedio de los 5 anteriores)
  const prev5avg = volUSDT.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  if (volUSDT[5] > prev5avg * 2) return { ok: false, fallo: 'Spike de volumen detectado' };

  // 9. Velas 4h sin drift (no más de 2 consecutivas del mismo color)
  const last4 = velas4h.slice(1, 5); // últimas 4
  let maxConsec = 1, actual = 1;
  for (let i = 1; i < last4.length; i++) {
    if (last4[i].color === last4[i-1].color) { actual++; maxConsec = Math.max(maxConsec, actual); }
    else actual = 1;
  }
  if (maxConsec >= 3) return { ok: false, fallo: `4h drift: ${maxConsec} velas ${last4[0].color} consecutivas` };

  // 10. Sin momentum activo en 15m (no 6+ velas del mismo color)
  let consec = 1;
  for (let i = 1; i < velas15m.length; i++) {
    if (velas15m[i].color === velas15m[i-1].color) consec++;
    else consec = 1;
    if (consec >= 6) return { ok: false, fallo: '6+ velas 15m consecutivas (momentum activo)' };
  }

  return { ok: true };
}
```

### FASE 2 — Dirección (Lambda evalúa, o Claude si se prefiere)

```javascript
function determinarDireccionColibri(rsi1m) {
  if (rsi1m >= 35 && rsi1m <= 45) return 'LONG';
  if (rsi1m >= 55 && rsi1m <= 65) return 'SHORT';
  return null; // zona neutra — no entrar
}
```

### FASE 2 — Orden de entrada

```javascript
function calcularOrdenColibri(precio, capital, leverage, direccion) {
  // AMBAS direcciones entran por debajo del mercado (fill casi seguro con momentum)
  const precioEntrada = parseFloat((precio * 0.999).toFixed(5));
  const quantity = Math.round((capital * leverage) / precio);

  return {
    symbol: 'ENAUSDT',         // o el par activo
    side: direccion === 'LONG' ? 'BUY' : 'SELL',
    positionSide: direccion,
    type: 'LIMIT',
    price: precioEntrada,
    quantity,
    timeInForce: 'GTC',
    leverage,
    marginType: 'ISOLATED'
  };
}
```

### FASE 3 — SL y Trailing Stop (después de confirmar fill)

```javascript
function calcularProteccionesColibri(entryPrice, direccion, symbol) {
  const slPrice = direccion === 'LONG'
    ? parseFloat((entryPrice * 0.995).toFixed(5))   // −0.5%
    : parseFloat((entryPrice * 1.005).toFixed(5));  // +0.5%

  const sl = {
    symbol,
    side: direccion === 'LONG' ? 'SELL' : 'BUY',
    positionSide: direccion,
    type: 'STOP_MARKET',
    triggerPrice: slPrice,
    closePosition: true
  };

  const ts = {
    symbol,
    side: direccion === 'LONG' ? 'SELL' : 'BUY',
    positionSide: direccion,
    type: 'TRAILING_STOP_MARKET',
    callbackRate: 0.5,   // 0.5% callback
    closePosition: true
    // Sin activationPrice → activa inmediatamente desde el entry
  };

  return { sl, ts };
}
```

### Gestión de riesgo Colibrí

- Pérdida máxima por trade: $20 × 10x × 0.5% = **$1 USDT**
- Fees por trade: ~$0.08 USDT (maker 0.02% + taker 0.04% sobre $200)
- Si 3 primeros trades son perdedores → detener sesión y notificar
- Timeout fill: 60 segundos → cancelar y reevaluar

---

## Estrategia 2 — Ojo de Halcón (reversal en pumps / zonas extremas)

### Parámetros

```
Par:           cualquier par con pump >100% o en soporte clave
Capital:       $100–$150 USDT
Leverage:      3x
Exposición:    $300–$450 USDT
Margen:        ISOLATED
positionSide:  SHORT (pumps) o LONG (soportes)
Activación:    manual — usuario define el par y las condiciones
```

### Condiciones SHORT (estrategia A — pump reversal)

```javascript
function evaluarCondicionesOjoHalconShort(datos) {
  const { rsi1h, funding, velas15m } = datos;

  // RSI extremo (sobreextensión)
  if (rsi1h < 85) return { ok: false, fallo: `RSI 1h = ${rsi1h}, necesita >85` };

  // Funding positivo (longs pagando = presión vendedora estructural)
  if (funding <= 0) return { ok: false, fallo: 'Funding negativo — NO shortear' };

  // Vela 15m roja con volumen (confirmación bajista)
  const ultimaVela = velas15m[velas15m.length - 1];
  if (ultimaVela.color !== 'RED') return { ok: false, fallo: 'Última vela 15m no es roja' };
  if (ultimaVela.vol < 5_000_000) return { ok: false, fallo: 'Volumen 15m insuficiente (<5M)' };

  return { ok: true };
}
```

### Ejecución Ojo de Halcón SHORT

```javascript
function calcularOrdenOjoHalconShort(precio, capital, leverage) {
  const quantity = Math.round((capital * leverage) / precio);

  const entrada = {
    symbol: 'XXXUSDT',
    side: 'SELL',
    positionSide: 'SHORT',
    type: 'MARKET',
    quantity,
    leverage,
    marginType: 'ISOLATED'
  };

  const sl = {
    type: 'STOP_MARKET',
    side: 'BUY',
    positionSide: 'SHORT',
    triggerPrice: parseFloat((precio * 1.08).toFixed(5)),  // SL +8% sobre entry
    closePosition: true
  };

  const tp1 = {
    type: 'TAKE_PROFIT_MARKET',
    side: 'BUY',
    positionSide: 'SHORT',
    triggerPrice: parseFloat((precio * 0.85).toFixed(5)),  // TP1 −15%
    quantity: Math.round(quantity * 0.5)                   // 50% de la posición
  };

  const tp2 = {
    type: 'TAKE_PROFIT_MARKET',
    side: 'BUY',
    positionSide: 'SHORT',
    triggerPrice: parseFloat((precio * 0.75).toFixed(5)),  // TP2 −25%
    closePosition: true
  };

  return { entrada, sl, tp1, tp2 };
}
```

### Condiciones LONG (estrategia B — soporte con oversold)

```javascript
function evaluarCondicionesOjoHalconLong(datos) {
  const { rsi1h, funding, precio, soporteClave } = datos;

  // RSI oversold en 1h
  if (rsi1h > 38) return { ok: false, fallo: `RSI 1h = ${rsi1h}, necesita <38` };

  // Precio cerca del soporte clave (dentro del 1%)
  const distSoporte = Math.abs(precio - soporteClave) / soporteClave * 100;
  if (distSoporte > 1) return { ok: false, fallo: `Precio a ${distSoporte.toFixed(1)}% del soporte` };

  // Funding no muy positivo (sin sesgo alcista forzado)
  if (funding > 0.05) return { ok: false, fallo: 'Funding muy positivo — esperar corrección' };

  return { ok: true };
}
```

---

## Estructura del motor Lambda sugerida

```
motor-trading/
├── index.js                    ← handler del cron (entry point)
├── estrategias/
│   ├── colibri.js              ← condiciones + cálculos Colibrí
│   └── ojo-de-halcon.js        ← condiciones + cálculos Ojo de Halcón
├── binance/
│   ├── client.js               ← wrapper fetch con firma HMAC
│   ├── klines.js               ← obtener velas
│   ├── account.js              ← balance y posiciones
│   └── orders.js               ← ejecutar, cancelar, algo orders
├── claude/
│   └── decision.js             ← llamar Claude API con snapshot
├── utils/
│   └── rsi.js                  ← calcularRSI(closes)
└── config.js                   ← símbolos activos, capital, estrategia activa
```

### Handler principal

```javascript
// index.js — se ejecuta cada 1 minuto via EventBridge
export const handler = async (event) => {
  const config = await getConfig(); // DynamoDB o SSM — qué estrategia está activa

  if (!config.activa) return { status: 'idle' };

  if (config.estrategia === 'colibri') {
    await runColibriCiclo(config);
  } else if (config.estrategia === 'ojo-de-halcon') {
    await runOjoHalconCiclo(config);
  }
};
```

---

## Notas de implementación

### Autenticación Binance
Todas las llamadas con datos de cuenta requieren firma HMAC-SHA256:
```
signature = HMAC_SHA256(queryString + body, secretKey)
```
Header requerido: `X-MBX-APIKEY: <apiKey>`

### Variables de entorno Lambda
```
BINANCE_API_KEY=...
BINANCE_SECRET_KEY=...
ANTHROPIC_API_KEY=...
BINANCE_ENV=production   # o testnet
```

### Testnet
- Endpoint: `https://testnet.binancefuture.com`
- Keys separadas (no mezclar con producción)

### Hedge Mode
La cuenta usa Hedge Mode — **siempre** pasar `positionSide` en cada orden. Sin esto da error -4061.

### Error -2022
No colocar SL/TP antes de que exista una posición abierta. Verificar primero con `GET /fapi/v2/account`.

---

## Preguntas pendientes de infra

### Bloque 1 — Infra básica (ver también `../sync-para-manuel.md`)

1. ¿Tenés Lambda con acceso a las keys de Binance ya configurado?
2. ¿Cuál es el intervalo mínimo de cron en tu infra? (necesitamos 1min exacto)
3. ¿Lambda pura o preferís ECS/EC2? Para crons de 1min Lambda alcanza; para WebSocket Binance a futuro necesitamos servicio dedicado.

### Bloque 2 — Decisión de arquitectura (Variante A vs B)

4. **¿Preferís Variante A o B?**
   - **A** (Claude API desde Lambda): autónomo 24/7, Diego no ve el chat en tiempo real, necesitás ANTHROPIC_API_KEY en Lambda
   - **B** (RemoteTrigger hacia VS Code): Diego ve todo en el chat, requiere sesión activa

5. **Si B: ¿RemoteTrigger acepta payload?** Necesitamos validar si Claude Code permite que Lambda pase un JSON con el snapshot del mercado al disparar el trigger. Sin payload, Claude tendría que re-llamar a Binance desde VS Code (pierde parte de la ventaja).

6. **Si A: ¿Tenés experiencia con Anthropic SDK en Node.js?** El código de referencia está en este doc — es straightforward, pero necesita manejo de errores y retry si Claude API da timeout.

### Bloque 3 — Observabilidad

7. ¿Usás CloudWatch hoy o preferís otra solución de logs? Necesitamos ver: qué condición falló en cada ciclo, cuándo se llamó a Claude, qué orden se ejecutó, resultado del fill.

8. ¿Querés notificaciones cuando se ejecuta un trade? (SNS → email/SMS, o webhook a Telegram/Slack)
