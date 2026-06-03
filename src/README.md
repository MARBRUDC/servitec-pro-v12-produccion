# SERVITEC PRO V13.27.0 ESTABLE

Base estable para Vercel con arquitectura estática `src/ → dist/`.

## Correcciones incluidas

- Migración automática desde `servitec_v139` y `servitec_pro_state_v1317` hacia `servitec_pro_state_v1327`.
- Persistencia triple temporal para evitar pérdida de empresas, clientes y cotizaciones.
- Correlativos por empresa como **siguiente número a emitir**: si colocas 206, sale `COT-2026-0206`.
- Edición de cotización conserva ID y correlativo.
- PDF de cotización profesional, compacto, con logo/firma y marca de agua.
- PDF toma la empresa de la cotización/empresa activa, no la primera empresa del arreglo.
- Botones Exportar/Importar respaldo JSON en Configuración.
- Vercel configurado como sitio estático: `npm run build` y salida `dist`.

## Despliegue Vercel

Framework/Application preset: Other
Build Command: npm run build
Output Directory: dist
Install Command: npm install

## Antes de subir una nueva versión

1. Exportar respaldo JSON desde Configuración.
2. Verificar empresa activa.
3. Verificar correlativo siguiente.
4. Crear cotización de prueba y PDF.
