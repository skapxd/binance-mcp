# sync-para-manuel — Pendientes de Diego para Manuel

> Canal Diego → Manuel.
> Manuel: al arrancar tu sesión Claude te avisa si hay ítems abiertos acá.
> Para responder: completá el texto debajo de cada pregunta y marcá `- [x]` cuando hayas respondido.

---

## Consulta principal — Arquitectura para estrategias automatizadas

Hola Manuel, estuve trabajando con Claude en varias ideas de estrategias que nos gustaría automatizar. La idea va más allá de los grids actuales de Binance — queremos construir nuestro propio motor de ejecución con control total.

**Qué queremos poder hacer:**

- Grids conservadores como los que tenemos activos, pero creados 100% por nosotros
- Estrategias de niveles dinámicos (el sistema reacciona al precio y reposiciona órdenes)
- En algún punto, estrategias de reacción rápida al precio (alta frecuencia relativa)
- Control de parámetros en tiempo real — desde MCP o interfaz simple
- Todo visible en Binance como órdenes LIMIT con nombre propio

**Propuestas que se nos ocurren (para que opines):**

- **A) Lambda + cron** — lo que ya tenés. Suficiente para grids conservadores (1%+ entre niveles). Simple y mantenible.
- **B) Lambda + WebSocket** — Lambda mantiene una conexión WebSocket persistente al precio de Binance. Reacción en <1s. Más complejo pero escala a cualquier estrategia.
- **C) Servicio dedicado** (ECS/EC2 con Node.js corriendo 24/7) — WebSocket nativo, estado en memoria, sin cold start. Más infra pero máximo control y latencia mínima.
- **D) Híbrido** — Lambda para grids conservadores (ya funciona), servicio dedicado solo para estrategias de alta frecuencia cuando las necesitemos.

---

## Preguntas — completá acá abajo

**¿Qué latencia real tiene tu Lambda de punta a punta?** (desde que el cron dispara hasta que la orden llega a Binance)

_Respuesta:_


---

**¿Cuál es el intervalo mínimo que podés configurar en el cron actualmente?**

_Respuesta:_


---

**¿Podrías implementar WebSocket en tu infra actual o requiere cambiar el approach completo?**

_Respuesta:_


---

**De las propuestas A/B/C/D de arriba, ¿cuál te parece más viable y mantenible a largo plazo?**

_Respuesta:_


---

**¿Algo que se te ocurra que no contemplamos?**

_Respuesta:_


---

Con tus respuestas Claude arma la arquitectura concreta para que encaje limpio en lo que ya tenés.

---

## Historial resuelto

| Fecha | Ítem | Resultado |
| ----- | ----- | --------- |
| —    | —    | —        |
