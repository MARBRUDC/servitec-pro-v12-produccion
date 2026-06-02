# SERVITEC PRO V13.21.0 ADMINISTRADOR ESTABLE

Versión consolidada del modelo Administrador.

Objetivo:
Cerrar el flujo administrativo:
Empresa → Cliente → Establecimiento → Área Usuaria → Cotización → PDF → Ejecutar.

Incluye:
- Empresas con selector único, botón Guardar, activar, eliminar.
- Configuración comercial guiada.
- Datos bancarios, contacto comercial y correlativos.
- Clientes jerárquicos: Cliente → Establecimiento → Área Usuaria.
- Cotizaciones con selector superior y acciones superiores.
- Equipos de cotización sin Serie, Patrimonial ni Ubicación.
- Serie, Patrimonial y Ubicación quedan para la Ejecución.
- Mantiene Supabase existente mediante app_state.

Pruebas obligatorias:
1. Empresas: editar y guardar condiciones comerciales.
2. Clientes: crear cliente, establecimiento y área.
3. Cotización: crear cotización y generar PDF.
4. Cambiar empresa activa y verificar que no se mezclen datos.
