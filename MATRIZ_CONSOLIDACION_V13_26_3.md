# Matriz de Consolidación SERVITEC PRO V13.26.3

Base funcional usada: V13.25.8 acta actividades repuestos.

Corrección crítica aplicada:
- Separación de frontend estático y entorno Node local.
- Eliminación de `main.js` raíz para que Vercel no lo ejecute como serverless.
- Eliminación de `server.js` raíz.
- Publicación exclusiva desde `dist/`.

Requisitos bloqueados:
- Editar cotización no debe generar nueva cotización.
- Ejecución debe heredar actividades y repuestos.
- Acta debe mostrar actividades ejecutadas y repuestos utilizados.
- Informe técnico debe ser independiente del acta.
- Multiempresa, roles, QR y correlativos quedan como requisitos obligatorios de consolidación funcional.
