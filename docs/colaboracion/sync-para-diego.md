# — Pendientes de Diego para Manuel

> Este archivo es el canal de comunicación de Diego → Manuel.
> Manuel: al arrancar tu sesión, Claude revisa este archivo y te avisa si hay ítems abiertos.
> Cuando completes un ítem, cambiá `- [ ]` por `- [x]` y agregá una nota si hace falta.

---

## Cómo usar este sistema

Cualquiera de los dos puede dejar pendientes en su archivo:

- Diego deja pendientes para Manuel → `docs/colaboracion/sync-para-manuel.md` (este archivo)
- Manuel deja pendientes para Diego → `docs/colaboracion/sync-para-diego.md`

Claude los revisa al inicio de cada sesión y avisa si hay algo abierto.

---

## Pendientes de Diego para Manuel

### Visión general — Grid propio sin depender de Binance Bot Trading

La idea que estamos explorando es construir nuestro propio sistema de grid, independiente de la UI de Binance, con control total sobre los parámetros. La estrategia exacta puede variar (conservadora como los bots actuales, dinámica con niveles, etc.) pero la tecnología es la misma.

**Por qué tiene sentido construirlo nosotros:**

- Sin límites de la UI de Binance (parámetros fijos, sin acceso API a grids)
- Las órdenes se crean como LIMIT con `newClientOrderId` personalizado → visibles en Binance con nombre propio → fácil de identificar y gestionar
- Control total: mover niveles, cambiar capital, cerrar todo → desde MCP o desde el Lambda directamente
- Posible interfaz futura (web o Claude como interfaz de voz/texto) para manejar parámetros en tiempo real

---

### La pregunta crítica para vos: latencia de Lambda

**Esto es lo más importante antes de diseñar cualquier estrategia.**

El intervalo de respuesta de Lambda define qué tipo de grid podemos construir:

| Latencia del cron     | Grid viable                                   | Grid no viable      |
| --------------------- | --------------------------------------------- | ------------------- |
| ~30s polling REST     | Conservador (1%+ entre niveles, como SOL/XRP) | Grid ajustado <0.5% |
| ~5s polling REST      | Semi-activo (0.5–1% entre niveles)           | HFT o scalping      |
| WebSocket tiempo real | Cualquier grid                                | —                  |

Un grid conservador como los que tenemos activos en Binance (1% entre niveles, pares como SOL/XRP/ADA) **no necesita WebSocket** — el precio tarda minutos en moverse 1%. Lambda con cron cada 30s es suficiente.

Un grid dinámico de niveles ajustados (0.2–0.5%) sí necesitaría WebSocket o al menos cron muy frecuente.

**Lo que necesito que me respondas:**

- [ ] ¿Qué intervalo tiene el cron actualmente y cuál es el mínimo que podés configurar?
- [ ] ¿Usás polling REST o tenés WebSocket de precio?
- [ ] ¿Cuánto tarda una ejecución completa de la Lambda (desde que dispara hasta que ejecuta la orden)?
- [ ] ¿Cómo persistís el estado entre ejecuciones? (DynamoDB, Redis, archivo S3?)
- [ ] ¿El sistema ya maneja futuros USD-M o solo spot?
- [ ] ¿Usás el SDK de Binance directamente o tenés el MCP integrado del lado tuyo?

Con esas respuestas, Claude puede diseñar la arquitectura exacta del grid para que encaje limpio en tu Lambda sin reescribir lo que ya tenés.

---

## Historial resuelto

| Fecha | Ítem | Resultado |
| ----- | ----- | --------- |
| —    | —    | —        |
