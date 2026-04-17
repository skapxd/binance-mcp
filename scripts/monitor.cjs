/**
 * monitor.cjs — Monitor de señales Pilar 2
 *
 * Uso desde Claude: "enciende loop XXXUSDT"
 * Uso manual:
 *   SYMBOL=BTCUSDT STOP=60000 TP=70000 SL=58000 node scripts/monitor.cjs
 *
 * Variables de entorno:
 *   SYMBOL      Par a monitorear            (default: BTCUSDT)
 *   RSI_MIN     RSI 15m mínimo para señal   (default: 35)
 *   VOL_MIN     Volumen mínimo vela 15m (M) (default: 5)
 *   PRICE_MIN   Precio mínimo para señal    (default: 0)
 *   STOP        Precio de invalidación      (default: 0)
 *   TP          Take profit referencia      (default: 0)
 *   SL          Stop loss referencia        (default: 0)
 *   ENV_PATH    Path al .env con API keys   (default: ./build/.env)
 *
 * Exit codes:
 *   0 = sin señal
 *   1 = SEÑAL LONG detectada
 *   2 = INVALIDADO (precio rompió STOP)
 */

const envPath = process.env.ENV_PATH || require('path').join(__dirname, '../build/.env');
require('dotenv').config({ path: envPath });

const https = require('https');
const BASE = 'fapi.binance.com';

function get(path) {
  return new Promise((r, j) =>
    https.get({ hostname: BASE, path }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
    }).on('error', j)
  );
}

const SYMBOL    = process.env.SYMBOL    || 'BTCUSDT';
const RSI_MIN   = parseFloat(process.env.RSI_MIN   || '35');
const VOL_MIN   = parseFloat(process.env.VOL_MIN   || '5');
const PRICE_MIN = parseFloat(process.env.PRICE_MIN || '0');
const STOP      = parseFloat(process.env.STOP      || '0');
const TP        = parseFloat(process.env.TP        || '0');
const SL        = parseFloat(process.env.SL        || '0');

(async () => {
  const [k15, fund, ticker] = await Promise.all([
    get('/fapi/v1/klines?symbol=' + SYMBOL + '&interval=15m&limit=10'),
    get('/fapi/v1/premiumIndex?symbol=' + SYMBOL),
    get('/fapi/v1/ticker/24hr?symbol=' + SYMBOL),
  ]);

  const c15 = k15.map(k => parseFloat(k[4]));
  let g = 0, l = 0;
  for (let i = 1; i < c15.length; i++) {
    const d = c15[i] - c15[i - 1];
    d > 0 ? g += d : l -= d;
  }
  const rsi15    = (100 - 100 / (1 + g / l)).toFixed(1);
  const funding  = (parseFloat(fund.lastFundingRate) * 100).toFixed(4);
  const price    = parseFloat(ticker.lastPrice);
  const lastC    = k15[k15.length - 1];
  const lastVol  = (parseFloat(lastC[7]) / 1e6).toFixed(2);
  const lastGreen = parseFloat(lastC[4]) >= parseFloat(lastC[1]);
  const last3    = k15.slice(-3).map(k => {
    const dir = parseFloat(k[4]) >= parseFloat(k[1]) ? '🟢' : '🔴';
    return dir + ((parseFloat(k[4]) - parseFloat(k[1])) / parseFloat(k[1]) * 100).toFixed(1) + '%';
  }).join(' ');

  const now = new Date().toISOString().slice(11, 16);
  process.stdout.write(now + ' ' + SYMBOL + ' $' + price + ' RSI15m:' + rsi15 + ' Fund:' + funding + '% Vol:' + lastVol + 'M ' + last3);

  if (STOP > 0 && price < STOP) {
    console.log('\n🔴 INVALIDADO — precio rompió $' + STOP);
    process.exit(2);
  } else if (
    parseFloat(rsi15) > RSI_MIN &&
    lastGreen &&
    parseFloat(lastVol) > VOL_MIN &&
    (PRICE_MIN === 0 || price > PRICE_MIN)
  ) {
    const tpStr = TP > 0 ? ' TP:$' + TP : '';
    const slStr = SL > 0 ? ' SL:$' + SL : '';
    console.log('\n🟢🟢 SEÑAL LONG — TODAS LAS CONDICIONES CUMPLIDAS. Entrar ~$' + price + tpStr + slStr);
    process.exit(1);
  } else {
    console.log('');
    process.exit(0);
  }
})();
