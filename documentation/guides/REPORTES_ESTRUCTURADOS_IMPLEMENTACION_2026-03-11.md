# Reportes Estructurados - Implementacion Frontend (2026-03-11)

## Objetivo
Documentar lo implementado en frontend para el modulo de Reportes Estructurados, tanto en React (Vite) como en la vista legacy (Jinja + JS), incluyendo la correccion del modal de criterios.

## Repositorio
- Frontend React: `/var/www/nextris-front-react`

## Vistas y rutas nuevas
Archivo: `src/routes/Routes.tsx`

Rutas agregadas (rol `Sysadmin`):
- `/reportes-estructurados/lista-parser`
- `/reportes-estructurados/mapeo-variables`
- `/reportes-estructurados/conceptos-criterios`
- `/reportes-estructurados/plantillas-inteligentes`

Archivo principal del modulo:
- `src/modules/reportes-estructurados/ReportesEstructurados.tsx`

Tabs funcionales:
1. Lista de parser
2. Mapeo de variables
3. Conceptos y criterios
4. Plantillas inteligentes (placeholder)

## Sidebar
Archivo: `src/layouts/Sidebar.tsx`

Se agrego seccion `Reportes estructurados` con subitems para las 4 rutas del modulo.

## Servicios frontend (API clients)

### `src/services/parser-facility-rel.service.ts`
Consume:
- `/structured-reports/parsers`
- `/structured-reports/parser-facility-relations` (GET/POST/DELETE)
- `/structured-reports/parser-facility-relations/sync` (PUT)
- `/structured-reports/parser-studytype-relations` (GET/POST/DELETE)
- `/structured-reports/parser-studytype-relations/sync` (PUT)

Tambien consulta catalogos:
- `/config/facilities`
- `/config/study-types`

### `src/services/variable-mapping.service.ts`
Consume:
- `/structured-reports/variable-definitions`
- `/structured-reports/variable-mappings` (GET/POST/PUT/DELETE)

### `src/services/criteria.service.ts`
Consume:
- `/structured-reports/criteria` (GET/POST/PUT/DELETE)
- `/structured-reports/criteria/evaluate` (POST)
- `/structured-reports/parser-variables` (GET)

## Pantalla: Lista de parser
Archivo: `src/modules/reportes-estructurados/ReportesEstructurados.tsx`

Funciones:
- Tabla de parsers
- Modal para asociar parser con:
  - Facilities
  - Tipos de estudio
- Guardado de asociaciones via endpoints `sync`

## Pantalla: Mapeo de variables
Archivo: `src/modules/reportes-estructurados/MapeoVariablesTab.tsx`

Funciones:
- Selector parser + facility
- Carga de mapeos con fallback (specific/generic)
- Alta de mapeo
- Edicion de mapeo especifico
- Eliminacion de mapeo especifico
- Creacion desde mapeo generico

UX destacada:
- Mensaje visual de modo fallback (`fallbackMode`)
- Tabla con columna `ORIGEN` (Especifico / Generico)

## Pantalla: Conceptos y criterios
Archivo: `src/modules/reportes-estructurados/ConceptosCriteriosTab.tsx`

Funciones:
- Selector parser
- Tabla de criterios (incluye inactivos)
- Crear/editar/eliminar criterio
- Constructor de reglas:
  - Multiples condiciones
  - Combinador logico `AND`/`OR` (`all`/`any`)
  - Operadores `> >= < <= == != between contains`
- Panel izquierdo de variables del parser
- Drag and drop de variable hacia condicion
- Vista previa JSON de la regla

## Fix importante del modal (variable no visible al editar)
Problema reportado:
- Al abrir modal en modo edicion, el campo `Variable` podia quedar vacio aunque el criterio tenia regla guardada.

Causa:
- El parser `fromRuleDefinition` solo esperaba una forma estricta (`all`/`any`) y no contemplaba bien algunos formatos reales guardados.

Solucion aplicada en:
- `src/modules/reportes-estructurados/ConceptosCriteriosTab.tsx`

Ajustes:
1. Soporte para regla tipo hoja:
```json
{ "variable": "...", "operator": ">=", "value": 42 }
```

2. Soporte para nodos `all`/`any` y anidados simples.

3. Compactacion de rango comun:
- Si detecta `var >= x` y `var <= y` en un `all`, hidrata UI como `between` con `value` y `value_to`.

Resultado:
- Al editar, la variable y operador se muestran correctamente en el formulario.

## Ajustes de UX del modal
Archivo: `src/modules/reportes-estructurados/ConceptosCriteriosTab.tsx`

Se ajusto el modal para uso comodo en escritorio:
- `size="full"`
- `sm:max-w-[1200px]`
- `min-h-[620px]`
- `h-[82vh]`

## Compatibilidad con vista legacy usada en produccion
Aunque este documento es del repo React, la operacion del usuario mostro uso de una vista legacy en backend (`nextris-dev-react`).

Se habilito en legacy:
- Tabla real de criterios por parser
- Carga desde API de structured reports

Archivos legacy involucrados (en backend repo):
- `apps/templates/home/reportes_estructurados.html`
- `apps/static/assets/js/scriptsReportesEstructurados.js`

## Build y despliegue
Comando validado:
```bash
npx vite build
```

Resultado:
- Build exitoso
- Regeneracion de `dist/`

Nota:
- `npm run build` puede fallar por errores TypeScript preexistentes de otros modulos no relacionados.

## Archivos frontend clave del modulo
- `src/modules/reportes-estructurados/ReportesEstructurados.tsx`
- `src/modules/reportes-estructurados/MapeoVariablesTab.tsx`
- `src/modules/reportes-estructurados/ConceptosCriteriosTab.tsx`
- `src/services/parser-facility-rel.service.ts`
- `src/services/variable-mapping.service.ts`
- `src/services/criteria.service.ts`
- `src/routes/Routes.tsx`
- `src/layouts/Sidebar.tsx`

## Estado funcional
- Lista de parser: operativo
- Asociaciones parser-facility-studytype: operativo
- Mapeo de variables: operativo
- Conceptos y criterios: operativo
- Edicion de criterio con variable visible: corregido
