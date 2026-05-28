# SERVITEC PRO V13.1 Campo Nube

Versión operativa para campo con React + Vite + Supabase.

## Subida a GitHub/Vercel
Subir solo:
- src
- index.html
- package.json
- vite.config.js
- README.md
- supabase-schema.sql
- .gitignore
- .env.example

No subir node_modules, dist ni package-lock.json.

## Variables en Vercel
Configurar en Project Settings > Environment Variables:

VITE_SUPABASE_URL=https://xmwrcbhskauucbhmuxdz.supabase.co
VITE_SUPABASE_KEY=tu_publishable_key

## Supabase
Ejecutar `supabase-schema.sql` en SQL Editor.

## Flujo incluido
- Empresas multiempresa.
- Clientes > establecimientos > áreas usuarias.
- Cotizaciones con 3 configuraciones: actividades generales, actividades propias, repuestos.
- Lista de cotizaciones con editar, PDF, CSV/Excel, Word/print y eliminar.
- Ejecución con actividades heredadas de cotización, estado, observaciones y evidencia.
- Acta e informe técnico corporativos con logo y datos de empresa.
- Inventario con QR y código de barras para equipos/repuestos.
- Responsive móvil.
- Modo local de respaldo si Supabase no está configurado.
