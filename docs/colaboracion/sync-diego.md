# Sync Diego — Pendientes para Manuel

> Este archivo es el canal de comunicación de Diego → Manuel.
> Manuel: al arrancar tu sesión, Claude revisa este archivo y te avisa si hay ítems abiertos.
> Cuando completes un ítem, cambiá `- [ ]` por `- [x]` y agregá una nota si hace falta.

---

## Cómo usar este sistema

Cualquiera de los dos puede dejar pendientes en su archivo:
- Diego deja pendientes para Manuel → `docs/colaboracion/sync-diego.md` (este archivo)
- Manuel deja pendientes para Diego → `docs/colaboracion/sync-manuel.md`

Claude los revisa al inicio de cada sesión y avisa si hay algo abierto.

---

## Pendientes de Diego para Manuel

### Infraestructura Lambda — preguntas para diseñar grid dinámico

Estamos explorando un **grid dinámico custom** (ver idea completa en [sync-manuel.md](sync-manuel.md)).
Para poder diseñar la integración necesito entender tu sistema:

- [ ] ¿Qué intervalo tiene el cron actualmente?
- [ ] ¿Cómo persistís el estado entre ejecuciones? (DynamoDB, Redis, archivo?)
- [ ] ¿Usás WebSocket de precio o polling REST?
- [ ] ¿El sistema ya maneja futuros USD-M o solo spot?
- [ ] ¿Tenés el MCP de Binance integrado del lado tuyo o usás el SDK directamente?

Cuando tengas las respuestas, dejame saber acá o en la próxima sesión conjunta con Claude.

---

## Historial resuelto

| Fecha | Ítem | Resultado |
|---|---|---|
| — | — | — |
