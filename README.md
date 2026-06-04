# SERVITEC PRO V13.27.1 ESTABLE FUNCIONAL

Base estable para Vercel con arquitectura estática `src/ -> dist/`.

## Correcciones incluidas

- Versión interna, README, `src/main.js`, `dist/main.js`, `index.html` y `dist/index.html` sincronizados en V13.27.1.
- Migración automática desde `servitec_pro_state_v1317` y `servitec_v139`.
- Escritura sincronizada en `servitec_pro_state_v1327`, `servitec_pro_state_v1317` y `servitec_v139`.
- Correlativos por empresa como **siguiente número a emitir**: si colocas 206, genera `COT-2026-0206`.
- PDF de cotización profesional con empresa activa/de la cotización, logo, firma, marca de agua, condiciones comerciales, banco, cuenta y CCI.
- Exportar e importar respaldo JSON desde Configuración.
- Estructura preparada para ejecución por actividad.

## Importante al subir a GitHub

Si el repositorio ya tenía archivos antiguos en raíz (`main.js`, `server.js`, `index.html`, `styles.css`, `build.js`), esta versión los incluye actualizados para evitar que Vercel sirva código viejo. Aun así, lo ideal es limpiar el repositorio y dejar solo esta versión.

## Configuración Vercel

- Framework: Other
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
