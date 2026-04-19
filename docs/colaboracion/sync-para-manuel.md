# sync-para-manuel — Pendientes de Diego para Manuel

> Canal Diego → Manuel.
> Manuel: al arrancar tu sesión Claude te avisa si hay ítems abiertos acá.
> Para responder: completá el texto debajo de cada pregunta y marcá `- [x]` cuando hayas respondido.

---

## Consulta principal — Arquitectura para Colibrí y Ojo de Halcón autónomos

Hola Manuel. Hicimos el primer test real de **Colibrí** (scalping autónomo en lateralización) y apareció un problema de arquitectura concreto que necesitamos resolver antes de dejarlo correr sin supervisión.

### El problema

Colibrí corre como un cron de 1min dentro de Claude Code. En cada ciclo Claude llama a la API de Binance, analiza condiciones, calcula RSI 1m con las últimas 20 velas y decide si entrar o no. Funciona bien en sesiones cortas (~30-40 min con `/compact` previo), pero el contexto de Claude se agota porque cada ciclo acumula datos en la conversación. No es viable dejarlo autónomo por horas.

Lo mismo aplica a **Ojo de Halcón** en el futuro.

### Lo que necesitamos

Un motor externo que corra el loop de vigilancia sin depender del contexto de Claude. Claude solo entraría a tomar la decisión de entrada/salida cuando el motor detecte condiciones potenciales — con contexto fresco cada vez.

### Flujo ideal (para que opines sobre implementación)

```
[Cron cada 1min]
  → Lambda corre FASE 1: llama a Binance directamente
      → Obtiene klines 1m (20 velas), RSI 1h, funding, velas 15m/4h
      → Evalúa las 10 condiciones de Colibrí
      → Si TODAS pasan: llama a Claude API con snapshot del mercado
          → Claude decide dirección (RSI 1m) y retorna parámetros de orden
          → Lambda ejecuta la orden LIMIT en Binance
          → Lambda monitorea fill (polling 10s)
          → Si llenó: Claude recibe confirmación → coloca SL + TS via Binance
          → Si no llenó en 60s: Lambda cancela orden
  → Si alguna condición falla: solo log, no llamar a Claude (ahorro de tokens)
```

**Ventaja clave:** Claude solo se invoca cuando el mercado está listo para entrar. El 95% de los ciclos son solo Lambda mirando números — sin costo de tokens, sin límite de contexto.

### Preguntas concretas

**¿Tenés Lambda con acceso a las keys de Binance ya configurado?**

_Respuesta:_


---

**¿Cuál es el intervalo mínimo del cron que podés configurar en tu infra?** (necesitamos 1min exacto)

_Respuesta:_


---

**¿Lambda pura o preferís ECS/EC2?** Para crons de 1min Lambda alcanza. Para WebSocket Binance a futuro necesitamos servicio dedicado.

_Respuesta:_


---

**Decisión de arquitectura — Variante A o B:**

Hay dos formas de integrar Claude. Ver detalle completo en `manuel/motor-autonomo-spec.md`:

- **Variante A:** Lambda llama a Claude API directamente → autónomo 24/7, Diego no ve el chat en tiempo real
- **Variante B:** Lambda dispara RemoteTrigger → Claude Code responde en el chat de VS Code de Diego, requiere sesión activa

¿Cuál preferís implementar? ¿O tenés otra idea?

_Respuesta:_


---

**Si Variante B: ¿RemoteTrigger de Claude Code acepta payload JSON?**

Necesitamos pasar el snapshot del mercado (precio, RSIs, velas) al disparar el trigger. Si solo acepta prompt de texto fijo, hay que serializar el JSON dentro del string. ¿Podés testear esto?

_Respuesta:_


---

**Observabilidad: ¿CloudWatch o preferís otra solución?** Necesitamos loguear: condición que falló, cuándo llamó a Claude, qué orden ejecutó, resultado del fill. ¿Querés notificaciones por SNS/Telegram cuando se ejecuta un trade?

_Respuesta:_


---

**¿Algo que no contemplamos?**

_Respuesta:_


---

Con tus respuestas armamos el diseño concreto.

📄 **Spec técnica completa (reglas de negocio + código de referencia):**
→ [`docs/colaboracion/manuel/motor-autonomo-spec.md`](./manuel/motor-autonomo-spec.md)

Incluye: arquitectura Lambda, endpoints Binance necesarios, cálculo RSI en JS, todas las condiciones de Colibrí y Ojo de Halcón en código Node.js listo para usar, estructura de carpetas sugerida del motor, y notas de implementación (Hedge Mode, autenticación HMAC, testnet vs producción).

---

## Historial resuelto

| Fecha | Ítem | Resultado |
| ----- | ----- | --------- |
| —    | —    | —        |
