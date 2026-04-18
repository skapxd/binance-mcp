# Sync Manuel — Ideas y trabajo en paralelo

> Este archivo documenta ideas, propuestas y trabajo pendiente de integración
> entre Diego (trading, estrategias) y Manuel (infraestructura, backend).
> Claude lee esto para entender el contexto de ambos lados y ayudar a integrar.

---

## Infraestructura de Manuel

- Sistema de compra/ejecución con **cron en AWS Lambda**
- Conexión a Binance API ya operativa (confirmar detalles con Manuel)
- Patrón: Lambda dispara cron → consulta precio → ejecuta orden

> ⚠️ Pendiente confirmar con Manuel: intervalo del cron, persistencia de estado (DynamoDB?), pares soportados, si usa producción o testnet.

---

## Ideas pendientes de integración

### Grid dinámico custom (Pilar 3 — experimental)

**Concepto (Diego):**
- Grid de N niveles activos, centrado dinámicamente en el último precio de ejecución
- Cada nivel separado por X% (ej. 1%)
- Los primeros N-1 niveles siguen la dirección del precio
- El último nivel apuesta a reversión
- Al ejecutarse un nivel, el grid se recentra automáticamente

**Por qué encaja en Lambda (Manuel):**
- Necesita correr 24/7 sin intervención manual
- Cron cada 10-30s es suficiente para altcoins medianas (no es HFT)
- Estado del grid (nivel actual, precio de referencia) persiste entre ejecuciones → DynamoDB o similar
- Ejecución via `BinanceCustomFuturesNewOrder` del MCP o directamente via Binance SDK

**Preguntas para Manuel antes de diseñar:**
- [ ] ¿Qué intervalo tiene el cron actualmente?
- [ ] ¿Cómo persiste el estado entre ejecuciones?
- [ ] ¿Tiene WebSocket de precio o usa polling REST?
- [ ] ¿El sistema ya maneja futuros o solo spot?

---

## Próximos pasos

- [ ] Diego coordina con Manuel para responder las preguntas de arriba
- [ ] Con las respuestas, Claude diseña la lógica del grid dinámico para integrar en Lambda
- [ ] Backtest simple antes de tocar capital real
