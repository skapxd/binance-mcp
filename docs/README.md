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
    ├── estrategias/
    │   ├── ojo-de-halcon.md               ← Estrategia autónoma de ejecución sin intervención
    │   ├── estrategias-limit-orders.md    ← Tipos de órdenes disponibles y estrategias
    │   ├── grid-futuros-conservador.md    ← Estrategia base Pilar 1
    │   ├── twap-acumulacion-grid.md       ← Adaptación TWAP → LIMIT orders
    │   ├── flujo-consulta-general.md      ← Protocolo de análisis diario
    │   └── ordenes-algo-twap-vp.md        ← Referencia órdenes algo
    ├── api-reference/
    │   └── capacidades-mcp.md             ← Qué funciona y qué no en la API
    ├── colaboracion/
    │   ├── sync-para-diego.md             ← Canal Manuel → Diego (pendientes entre sesiones)
    │   └── sync-para-manuel.md            ← Canal Diego → Manuel (pendientes entre sesiones)
    └── traders/
        ├── diego/
        │   ├── perfil.md                  ← Zona horaria ARG GMT-3, capital, estilo
        │   └── watchlist.md               ← Bots activos + oportunidades Pilar 2
        └── manuel/
            ├── perfil.md                  ← Zona horaria COL GMT-5, rol infra
            └── watchlist.md               ← (a crear cuando opere)
```

---

## Visión general del proyecto

La idea central es usar a Claude como **co-piloto de trading**: no solo ejecutar órdenes mecánicamente,
sino analizar contexto de mercado, evaluar condiciones, y decidir cuándo y cómo entrar/salir de posiciones.

### Qué se puede hacer HOY con este MCP

| Categoría | Capacidad |
|---|---|
| Mercado | Precios, orderbook, klines, funding rate, RSI |
| Cuenta | Balance, posiciones abiertas, órdenes abiertas |
| Futuros | Órdenes LIMIT/MARKET con leverage y margin |
| Algo Orders | SL, TP, Trailing Stop via `/fapi/v1/algoOrder` |
| Análisis | BinanceCustomFuturesAnalyze — snapshot completo en un llamado |
| Grids (Pilar 1) | Parámetros calculados por Claude, creados desde UI de Binance |
| Autónomo | Ojo de Halcón — monitoreo + ejecución sin intervención humana |

### Qué NO se puede hacer via API

- Ver o crear grids desde la API (solo desde UI de Binance)
- Modificar grids existentes

---

## Filosofía de trabajo

1. **Dos pilares** — Pilar 1 grids conservadores (capital principal), Pilar 2 oportunista (capital limitado)
2. **Analizar antes de actuar** — RSI, funding, volumen y contexto antes de cualquier entrada
3. **Documentar por trader** — watchlist y trades en `docs/traders/[nombre]/`
4. **Autónomo cuando se activa** — Ojo de Halcón ejecuta sin confirmación, reporta en chat
