/**
 * TESTNET ORDER VALIDATOR v3
 * Valida todos los endpoints disponibles incluyendo OCO y alternativos.
 * Uso: node testnet-validator.js
 * Requiere: build/.env.testnet
 */

import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'build/.env.testnet') });

const BASE   = 'https://testnet.binancefuture.com';
const KEY    = process.env.BINANCE_API_KEY;
const SECRET = process.env.BINANCE_API_SECRET;
const SYM    = 'BTCUSDT';

if (!KEY || KEY === 'TU_TESTNET_API_KEY') {
  console.error('❌ Completá build/.env.testnet con tus keys de testnet');
  process.exit(1);
}

const headers    = { 'X-MBX-APIKEY': KEY, 'Content-Type': 'application/x-www-form-urlencoded' };
const headersGet = { 'X-MBX-APIKEY': KEY };
const sign       = (q) => crypto.createHmac('sha256', SECRET).update(q).digest('hex');
const getTs      = async () => (await axios.get(BASE + '/fapi/v1/time')).data.serverTime;
const sleep      = (ms) => new Promise(r => setTimeout(r, ms));
const resultados = [];

async function postEndpoint(label, endpoint, params) {
  try {
    const ts = await getTs();
    const p  = new URLSearchParams({ ...params, timestamp: ts });
    p.append('signature', sign(p.toString()));
    const res = await axios.post(`${BASE}${endpoint}`, p.toString(), { headers });
    console.log(`  ✅ ${label} | status: ${res.data.status || 'OK'}`);
    resultados.push({ label, ok: true, endpoint, detail: res.data.status || 'OK', orderId: res.data.orderId });
    return res.data;
  } catch (e) {
    const code = e.response?.data?.code || '—';
    const msg  = e.response?.data?.msg  || e.message;
    console.log(`  ❌ ${label} | ERROR ${code}: ${msg}`);
    resultados.push({ label, ok: false, endpoint, code, detail: msg });
    return null;
  }
}

async function cancelAll() {
  try {
    const ts = await getTs();
    const q  = `symbol=${SYM}&timestamp=${ts}`;
    await axios.delete(`${BASE}/fapi/v1/allOpenOrders?${q}&signature=${sign(q)}`, { headers });
    console.log('  🧹 Órdenes canceladas');
  } catch (_) {}
}

async function cerrarPosicion() {
  try {
    const ts = await getTs();
    const p  = new URLSearchParams({
      symbol: SYM, side: 'SELL', type: 'MARKET',
      quantity: 0.001, reduceOnly: 'true', timestamp: ts
    });
    p.append('signature', sign(p.toString()));
    await axios.post(`${BASE}/fapi/v1/order`, p.toString(), { headers });
    console.log('  🧹 Posición long cerrada');
  } catch (_) {}
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BINANCE FUTURES TESTNET — VALIDADOR v3');
  console.log('  Incluye: OCO, batch orders, endpoints alternativos');
  console.log('═══════════════════════════════════════════════════\n');

  // Conexión
  const ts0  = await getTs();
  const bal  = await axios.get(`${BASE}/fapi/v2/balance?timestamp=${ts0}&signature=${sign('timestamp='+ts0)}`, { headers: headersGet });
  const usdt = bal.data.find(b => b.asset === 'USDT');
  console.log(`🔑 Conexión OK | Balance: ${usdt?.balance} USDT`);

  const precio  = parseFloat((await axios.get(`${BASE}/fapi/v1/ticker/price?symbol=${SYM}`)).data.price);
  const stopL   = parseFloat((precio * 0.92).toFixed(1));
  const tpL     = parseFloat((precio * 1.08).toFixed(1));
  const entryL  = parseFloat((precio * 0.97).toFixed(1));
  console.log(`Precio ${SYM}: $${precio} | Stop: $${stopL} | TP: $${tpL}\n`);

  // ── BLOQUE 1: Abrir posición base con MARKET ────────────
  console.log('── BLOQUE 1: Abrir posición MARKET (base para tests) ──');
  await postEndpoint('MARKET BUY (abrir long)', '/fapi/v1/order', {
    symbol: SYM, side: 'BUY', type: 'MARKET', quantity: 0.001
  });
  await sleep(500);

  // ── BLOQUE 2: OCO via /fapi/v1/order/oco ───────────────
  console.log('\n── BLOQUE 2: OCO (Take Profit + Stop Loss juntos) ──────');
  console.log('  Concepto: una sola llamada coloca TP y SL simultáneamente');

  await postEndpoint('OCO SELL (TP+SL sobre long)', '/fapi/v1/order/oco', {
    symbol: SYM, side: 'SELL', quantity: 0.001,
    price: tpL,           // precio del take profit limit
    stopPrice: stopL,     // precio que activa el stop
    stopLimitPrice: parseFloat((stopL * 0.995).toFixed(1)),
    stopLimitTimeInForce: 'GTC'
  });
  await sleep(400);

  // ── BLOQUE 3: Bracket order via /fapi/v1/batchOrders ───
  console.log('\n── BLOQUE 3: Batch Orders (múltiples órdenes en una llamada) ──');
  console.log('  Concepto: enviar TP y SL en una sola request');

  const batchOrders = JSON.stringify([
    { symbol: SYM, side: 'SELL', type: 'TAKE_PROFIT_MARKET',
      quantity: '0.001', stopPrice: tpL.toString(), reduceOnly: 'true' },
    { symbol: SYM, side: 'SELL', type: 'STOP_MARKET',
      quantity: '0.001', stopPrice: stopL.toString(), reduceOnly: 'true' }
  ]);

  await postEndpoint('BATCH: TP_MARKET + STOP_MARKET', '/fapi/v1/batchOrders', {
    batchOrders
  });
  await sleep(400);

  // ── BLOQUE 4: closePosition flag ───────────────────────
  console.log('\n── BLOQUE 4: STOP_MARKET con closePosition=true ────────');
  console.log('  Variante: sin especificar quantity, cierra toda la posición');

  await postEndpoint('STOP_MARKET closePosition', '/fapi/v1/order', {
    symbol: SYM, side: 'SELL', type: 'STOP_MARKET',
    stopPrice: stopL, closePosition: 'true'
  });
  await sleep(400);

  // ── BLOQUE 5: conditional order via /fapi/v1/conditional/order ──
  console.log('\n── BLOQUE 5: Endpoint /conditional/order ───────────────');

  await postEndpoint('STOP_MARKET via /conditional/order', '/fapi/v1/conditional/order', {
    symbol: SYM, side: 'SELL', strategyType: 'STOP',
    quantity: 0.001, stopPrice: stopL, timeInForce: 'GTC'
  });
  await sleep(400);

  // ── BLOQUE 6: TRAILING via parámetro activationPrice ───
  console.log('\n── BLOQUE 6: TRAILING_STOP_MARKET con activationPrice ──');

  await postEndpoint('TRAILING_STOP con activationPrice', '/fapi/v1/order', {
    symbol: SYM, side: 'SELL', type: 'TRAILING_STOP_MARKET',
    quantity: 0.001, callbackRate: 2.0,
    activationPrice: parseFloat((precio * 1.02).toFixed(1)),
    reduceOnly: 'true'
  });
  await sleep(400);

  // Limpiar
  console.log('\n── Limpieza ─────────────────────────────────────────────');
  await cancelAll();
  await cerrarPosicion();

  // ── RESUMEN ───────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════');
  resultados.forEach(r => {
    const icon = r.ok ? '✅' : '❌';
    const info = r.ok ? r.detail : `${r.code}: ${r.detail}`;
    console.log(`${icon} ${r.label.padEnd(42)} [${r.endpoint}]`);
    if (!r.ok) console.log(`   └─ ${info}`);
  });

  const ok    = resultados.filter(r => r.ok).length;
  const total = resultados.length;
  console.log(`\n📊 Resultado: ${ok}/${total} funcionan`);
  if (ok === 0) console.log('⚠️  Ningún endpoint condicional disponible — operar solo con LIMIT+MARKET');
  if (ok > 0)  console.log('✅ Actualizar docs/api-reference/capacidades-mcp.md con los resultados');
}

main().catch(console.error);
