# Reglas Generales de Diseno de Tablas (Base: Redaccion de Reportes)

## Objetivo
Definir un patron unico para todas las tablas de `Configuracion`, usando como referencia la experiencia de `Redaccion de reportes`.

## Reglas obligatorias

1. Estructura de tabla
- Usar `TablaDynamic` como componente base.
- Encabezado visual consistente (fondo de marca, texto claro, scroll interno).
- Estado vacio con mensaje claro (`No hay datos disponibles` o uno especifico por modulo).

2. Filtros con lupa por columna
- Cada columna de datos debe permitir filtro rapido desde el encabezado.
- El icono de lupa debe estar visible al hover y quedar resaltado cuando hay filtro activo.
- El filtro debe ser no destructivo y reversible (boton de limpiar filtro en la misma cabecera).

3. Orden con flechas
- Cada columna de datos debe soportar orden asc/desc/reset.
- Iconografia obligatoria:
  - `ArrowUpDown`: sin orden aplicado.
  - `ArrowUp`: orden ascendente.
  - `ArrowDown`: orden descendente.

4. Pie de tabla estandar
- El pie debe contener siempre:
  - Selector `Filas` (cantidad por pagina).
  - Selector `Columnas` (mostrar/ocultar columnas).
  - Navegacion de paginacion con pagina activa destacada.
- La pagina activa debe destacarse visualmente con color de marca.

5. Comportamiento de paginacion
- Si la tabla es client-side, usar `serverSide: false` y paginar localmente.
- Si la tabla es server-side, respetar `total` y callbacks del backend.
- Cuando cambia `Filas`, reiniciar a pagina 1.

## Aplicacion en Configuracion
Estas reglas aplican a todos los modulos dentro de:
- `src/modules/configuracion/configuracion-tablas/**`

Incluye tablas principales y secundarias (por ejemplo: tablas maestras, relaciones, agendas y listados operativos).

## Criterio de implementacion
- No crear tablas HTML manuales nuevas dentro de `Configuracion`.
- Cualquier nueva tabla debe implementar `TablaDynamic` + `TablePagination`.
- Si un modulo necesita excepciones, debe documentarlas en el propio modulo y mantener las 3 capacidades base:
  - filtro por columna,
  - orden por columna,
  - pie con filas/columnas/paginacion.
