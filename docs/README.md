# Binance MCP — Centro de Documentación

Este proyecto conecta Claude (IA) directamente con la API de Binance via MCP (Model Context Protocol),
permitiendo consultar datos, analizar mercados y ejecutar órdenes desde una conversación con la IA.

## Estructura de la documentación

```
/
├── CLAUDE.md                              ← Cerebro del sistema (leer primero) ⭐
└── docs/
    ├── README.md                          ← Este archivo
    ├── protocolo-operativo.md             ← Flujo completo: análisis → testnet → producción ⭐
    ├── mercado/
    │   └── watchlist.md                   ← Bots activos + oportunidades en seguimiento
    ├── estrategias/
    │   ├── estrategias-limit-orders.md    ← 5 estrategias con órdenes disponibles
    │   ├── grid-futuros-conservador.md    ← Estrategia base Pilar 1
    │   ├── twap-acumulacion-grid.md       ← Adaptación TWAP → LIMIT orders
    │   ├── flujo-consulta-general.md      ← Protocolo de análisis diario
    │   └── ordenes-algo-twap-vp.md        ← Referencia órdenes (TWAP no disponible API)
    └── api-reference/
        └── capacidades-mcp.md             ← Qué funciona y qué no en la API
```

---

## Visión general del proyecto

La idea central es usar a Claude como **co-piloto de trading**: no solo ejecutar órdenes mecánicamente,
sino analizar contexto de mercado, evaluar condiciones, y decidir cuándo y cómo entrar/salir de posiciones.

### Qué se puede hacer HOY con este MCP

| Categoría | Capacidad | Requiere Keys |
|---|---|---|
| Mercado | Precios, orderbook, klines, funding rate | No |
| Cuenta | Balance, posiciones abiertas, historial | Sí |
| Spot Trading | Crear/cancelar órdenes limit/market | Sí |
| Algo Orders | TWAP y VP en Futuros USD-M | Sí |
| Grid Futuros | Crear grids Long/Short/Neutral via API | Sí |
| Simple Earn | Consultar y gestionar posiciones Earn | Sí |

### Qué NO se puede hacer via API

- Ver grids creados desde la UI web de Binance (limitación de Binance)
- Modificar grids existentes creados desde la UI
- Acceder a datos de Copy Trading propios

---

## Filosofía de trabajo

1. **Analizar antes de actuar** — Claude consulta precios, funding, volumen y contexto antes de sugerir entradas
2. **Documentar cada estrategia** — cada idea queda escrita con sus parámetros, lógica y resultados esperados
3. **Iterar** — empezar conservador, medir, ajustar

---

## Próximos pasos sugeridos

- [ ] Documentar parámetros exactos de la estrategia grid actual
- [ ] Explorar uso de TWAP para entradas graduales en tendencia
- [ ] Diseñar lógica de "cuándo abrir un nuevo grid" basada en datos de mercado
- [ ] Evaluar VP orders para acumulación en rangos laterales
