# SERVITEC PRO V13.21.1 ADMINISTRADOR ESTABLE

Corrección puntual sobre V13.21.0:

- Cliente guarda y recupera correctamente:
  - Dirección
  - Teléfono
  - Correo
  - Responsable
- Se agregan alias de compatibilidad para datos antiguos.
- Se fuerza persistencia en nube cuando existe saveCloud().
- Mantiene Empresas, Clientes jerárquicos, Cotizaciones y PDF profesional.

Prueba:
1. Seleccionar cliente.
2. Llenar dirección, teléfono, correo y responsable.
3. Guardar.
4. Presionar F5.
5. Volver a seleccionar cliente.
6. Los campos deben aparecer completos.
