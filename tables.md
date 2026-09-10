# Tablas de NextRIS Frontend

Guía para crear o modificar tablas en el frontend. Basada en:

- [src/components/TableDynamic.tsx](src/components/TableDynamic.tsx)
- [src/components/Pagination.tsx](src/components/Pagination.tsx)
- [src/components/ui/table.tsx](src/components/ui/table.tsx)
- [src/types/table.ts](src/types/table.ts)
- [src/index.css](src/index.css)

La ruta de worklist está en [src/modules/worklist/index.tsx](src/modules/worklist/index.tsx), pero su tabla se implementa en [src/modules/redaccion/Radiologia/Radiologia.tsx](src/modules/redaccion/Radiologia/Radiologia.tsx).

## 1. Arquitectura

| Responsabilidad | Ubicación |
|---|---|
| Tipo de fila y respuesta API | "types/*.ts" |
| Columnas y acciones | "components/columns.tsx" |
| Llamadas HTTP | "services/*.service.ts" |
| React Query y mutations | "hooks/*.tsx" |
| Filtros y composición | Componente del módulo |
| Renderizado común | "src/components/TableDynamic.tsx" |

Usar TablaDynamic como opción estándar. Las tablas escritas directamente con Table, TableHeader, TableBody, etc. no reciben automáticamente filtros de cabecera, ordenamiento, selector de columnas, copiar celdas ni la paginación común.

## 2. Columnas

TableColumn<T> se define en [src/types/table.ts](src/types/table.ts).

~~~tsx
const columns: TableColumn<Row>[] = [
  {
    key: "name",
    label: "NOMBRE",
    sortable: true,
    filterable: true,
    className: "font-medium",
    headerClassName: "w-[180px]",
    render: (value, row) => <span title={value}>{value}</span>,
  },
]
~~~

| Propiedad | Comportamiento |
|---|---|
| "key" | Campo de la fila; admite rutas anidadas con punto y columnas virtuales como "_selection". |
| "label" | Texto de cabecera y del selector. |
| "sortable" | Por defecto true; false elimina ordenamiento y cursor. |
| "filterable" | Por defecto true; false elimina el botón de filtro. |
| "render" | Formatea fechas, estados, badges y componentes interactivos. |
| "headerRender" | Sustituye la cabecera normal; se usa para seleccionar todo. |
| "className" | Clases de las celdas. |
| "headerClassName" | Clases y ancho: "w-[88px]", "min-w-[100px]", "text-center". |
| "headerTitle" | Título descriptivo para cabeceras abreviadas. |
| "resizable" | Por defecto sí. false oculta el tirador; las fijas no se redimensionan. |
| "hideOnMobile" | Aplica "hidden md:table-cell" a cabecera y celdas. |
| "mobile" | Metadatos role, label, order e icon para una vista móvil. Hoy no crea cards. |

Reglas:

- null y undefined se muestran como "-", salvo que render defina otro fallback.
- Las celdas usan "overflow-hidden whitespace-nowrap text-ellipsis"; textos largos deben añadir "truncate", "max-w-*" y "title".
- Toda celda textual puede mostrar botón de copiar al pasar el cursor, excepto "_selection" y valores vacíos.
- Todo botón, checkbox, popover o enlace dentro de una fila debe usar event.stopPropagation().
- Las fechas de worklist se presentan con fechaYhora, nunca con el ISO crudo.

## 3. Props de TablaDynamic

| Prop | Uso |
|---|---|
| data | Filas. |
| columns | Columnas visibles. |
| allColumns | Todas las columnas del selector. |
| actions | Acciones de fila. |
| loading | Spinner central del cuerpo. |
| emptyMessage | Mensaje de resultado vacío. |
| showIndex | Columna # con índice global según página. |
| rowIdKey | ID para selección/copia; por defecto guid. |
| onRowClick / onRowDoubleClick | Reciben (row, index, event). |
| selectedRow / selectedRowIds | Resaltado de selección individual o múltiple. |
| pagination | page, pageSize y total; server-side por defecto. |
| onPaginationChange | Callback (page, pageSize); necesario para mostrar paginador. |
| perPageValue / onPerPageChange / perPageOptions | Selector de filas. |
| visibleColumns / onToggleColumn | Control de visibilidad. |
| fixedColumnKeys | Siempre visibles, al principio y no reordenables. |
| onColumnOrderChange | Recibe el orden tras drag and drop. |
| additionalControls | Controles junto al selector; worklist lo usa para selección, siguiente estudio y refresco. |
| maxHeight | Altura máxima del marco; el scroll ocurre dentro. |
| tableClassName | Clases del elemento table. |
| serverSideFiltering | Si true, evita filtro local. |
| onColumnFiltersChange | Recibe { [columnKey]: value }. |
| sortColumn / sortDirection / onSortChange | Orden controlado por servidor. |
| preserveTableHeight | Añade filas vacías para conservar altura. |
| stickyPagination | Fija el paginador al fondo. |
| compactSpacing | Elimina margen/espaciado superior. |
| tableBackgroundImage / tableBackgroundImageDark | Fondo fijo por tema, con máscara y fade. |
| mobileMode / mobileActions / mobileStatusKey | Están tipados, pero no se consumen en la implementación actual. |

## 4. Acciones

TableAction<T> admite:

| Propiedad | Uso |
|---|---|
| label | Texto del tooltip o función por fila. |
| icon | Icono o función por fila. |
| onClick | Handler (row, index). |
| component | Componente propio en espacio h-8 w-8; útil para popovers. |
| variant | Variante de Button; destructive activa hover rojo. |
| disabled | Función para bloquear por fila. |
| hidden | Función para ocultar por fila; deja placeholder h-8 w-8. |
| mobilePrimary | Metadato sin efecto en el render actual. |

~~~text
celda:  py-1 px-2 overflow-visible
botón:  h-8 w-8 shrink-0
grupo:   flex items-center justify-start gap-1 w-max min-w-full whitespace-nowrap
hover:   hover:bg-brand-purple/15 dark:hover:bg-purple-800/45
~~~

Cada acción normal tiene tooltip superior. Ocultar por datos o permisos cuando no corresponda ofrecerla.

## 5. Paginación, orden y filtros

### Paginación

~~~tsx
const pagination = {
  page,
  pageSize: perPage,
  total,
  // serverSide: true es implícito
}
~~~

- La API entrega la página; no se vuelve a cortar localmente.
- Para paginación local usar explícitamente serverSide: false.
- Incluye primera, anterior, números con elipsis, siguiente y última.
- En móvil muestra página/total y botones h-11 w-11.
- Valores habituales: [10, 20, 50, 100].
- Cambiar filtros, orden o tamaño debe volver a page = 1.

### Ordenamiento

Tiene tres estados: ascendente, descendente y sin orden.

- Local: strings con localeCompare; valores primitivos con comparación normal.
- Servidor: pasar sortColumn, sortDirection y onSortChange; no reordenar localmente.
- Iconos: ArrowUp/ArrowDown solo en la columna activa.
- Valores nulos quedan al final.

### Filtro por columna

- Icono Search visible al pasar sobre la cabecera.
- Input con autofocus, placeholder basado en el label y cierre con Enter, Escape o blur.
- Filtro activo en amarillo (text-yellow-300) y limpieza con X.
- Filtro local: includes, case-insensitive; varios filtros se combinan con AND.
- Filtro servidor: usar serverSideFiltering y traducir keys en onColumnFiltersChange.
- Columnas de iconos, tags, banderas y acciones deben tener filterable: false.

## 6. Estilos comunes

### Tokens

Tailwind CSS 4 usa estos valores de src/index.css:

| Token | Valor |
|---|---|
| brand-purple | #440f6d |
| --radius | 0.46875rem |
| --spacing | 0.1875rem |
| text-xs | 0.5625rem / 0.75rem |
| text-sm | 0.65625rem / 0.9375rem |
| body | 0.75rem / 1.125rem |

La escala compacta es intencional para listados de alta densidad.

### Base y tabla dinámica

src/components/ui/table.tsx aporta:

~~~text
container: relative w-full max-w-full overflow-x-auto overscroll-x-contain table-scrollbar-purple
table:     w-full caption-bottom text-sm
thead:     [&_tr]:border-b
tr:        bg-background hover:bg-muted/50 border-b border-border transition-colors
th:        h-10 px-2 text-left align-middle font-medium whitespace-nowrap
td:        p-2 align-middle whitespace-nowrap
~~~

TablaDynamic añade:

~~~text
marco:    rounded-xl border border-border/70 relative flex-1 overflow-hidden backdrop-blur-sm
tabla:    w-full table-fixed select-none
cabecera: sticky top-0 z-20, gradiente morado, texto blanco, sombra inferior
celdas:   py-2 px-3 text-xs overflow-hidden whitespace-nowrap text-ellipsis
filas:    transición de color y fade-in escalonado de 40 ms
~~~

Estados:

- Cabecera light: linear-gradient(90deg,#6a1bb0,#4a148c).
- Cabecera dark: linear-gradient(90deg,#4a157a,#2d0d52).
- Filas normales: bg-card/65, impares bg-card/75; dark #140f27/#1a1331.
- Fila clicable: hover morado claro en light y oscuro en dark.
- Fila seleccionada: fondo morado, border-l-4 border-l-brand-purple y sombra interior dark.
- Valor nulo: text-muted-foreground.
- Destructivo: hover rojo.
- Checkbox activo: brand-purple en light y purple/primary en dark.

### Scrollbar y fondos

Aplicar table-scrollbar-purple al contenedor con scroll. En src/index.css:

- Firefox: scrollbar fina y thumb morado.
- Chromium/WebKit: ancho/alto 10px.
- Track: rgba(68, 15, 109, 0.12).
- Thumb: gradiente morado, redondeado y con borde claro.
- En TablaDynamic el marco externo no debe recibir overflow adicional: el scroll vertical se hace dentro.

Worklist usa:

~~~tsx
tableBackgroundImage={fondoImage}       // src/assets/redaccion.jpg
tableBackgroundImageDark={backDarkImage} // src/assets/back-dark.jpg
~~~

El fondo usa cover, posición centrada, blend overlay, máscara permanente y fade de 1200ms; la capa es pointer-events-none.

## 7. Worklist / Radiología

### Flujo API

El hook useInformes consulta:

~~~text
GET /api/examinations/for-reporting
~~~

| Parámetro | Uso |
|---|---|
| page, per_page | Paginación. |
| search | Búsqueda general; debounce de 500 ms. |
| show_reported | Finalizados; administración lo fuerza a true. |
| show_ready | Listo para leer; administración lo usa para incluir sin finalizar. |
| assigned_to_me | Solo asignados al usuario actual. |
| show_no_image | Incluir sin imágenes. |
| show_without_order | Incluir sin orden CP; por defecto true en worklist normal. |
| show_only_with_notes | Solo con notas. |
| modality_id | Modalidad. |
| body_part_id | Parte del cuerpo; el estado se llama bodyPartId. |
| study_group_id | Grupo de estudio. |
| flag_filter | CSV: red,green,blue,yellow. |
| date_range | all, 1d, 3d, 7d, 14d, 1m, 2m, 3m, 1y. |
| date_field | admision o reporte. |
| sort_column / sort_direction | Orden servidor. |
| facility_id | Institución activa; fallback 1. |

Respuesta:

~~~ts
{
  success: boolean,
  data: {
    data: Informes[],
    page: number,
    per_page: number,
    total: number,
    timezone?: string
  }
}
~~~

React Query reconsulta cada 120 segundos en primer plano. Las mutations invalidan las listas relacionadas.

### Modelo de fila

Campos usados por la tabla:

~~~ts
{
  guid: string;
  patient_name: string;
  patient_dni: string;
  study_type: string;
  status: string;
  admission_number: string;
  accession_number: string;
  created_on: string;
  num_instances: number;
  is_reported: boolean;
  is_executed: boolean;
  is_image: boolean;
  report_available: boolean;
  blocked_by: string;
  blocked_by_name: string;
  study_instance_uid: string;
  assignto_name: string;
  report_date: string | null;
  flags: string[];
  tag_ids: string[];
  recent_notes: StudyNote[];
  notes_count: number;
}
~~~

### Columnas

Definidas en [src/modules/redaccion/Radiologia/components/columns.tsx](src/modules/redaccion/Radiologia/components/columns.tsx).

| Key | Label | Función/estilo | Móvil |
|---|---|---|---|
| _selection | — | Checkbox por fila y seleccionar todo; no sortable/filterable. | Visible normal |
| patient_name | PACIENTE | font-medium; candado si bloqueado; admin puede desbloquear desde el icono. | Título |
| patient_dni | DNI | Ancho aproximado 88px. | Detalle |
| assignto_name | ASIGNADO | Fallback Sin asignar; ancho 130px. | Sin metadato |
| study_type | EXAMEN | Truncado a 250px con title; sortable/filterable. | Detalle; hideOnMobile |
| status | ESTADO | Ancho 68px; sortable/filterable. | Detalle; hideOnMobile |
| admission_number | ADM. Nº | Ancho 80px. | Oculto |
| accession_number | ACC. Nº | Mínimo 100px. | Detalle |
| created_on | FECHA Y HORA DE ADMISION | Formato fechaYhora; ancho 130px. | Detalle |
| num_instances | INS | Centrado, fallback 0; ancho 64px. | Sin metadato |
| is_reported | — | CheckCircle2 verde o Clock amarillo; columna fija. | Estado |
| report_date | FECHA REPORTE | Formato fechaYhora; — sin fecha. | Oculto |
| flags | BANDERAS | Popover inline para roja, verde, azul y amarilla; no sortable/filterable. | Oculto |
| tag_ids | TAGS | Popover inline, color determinista por GUID; no sortable/filterable. | Oculto |

Columnas iniciales:

- Normal: _selection, patient_name, patient_dni, assignto_name, study_type, accession_number, created_on, num_instances, flags, tag_ids.
- Administrativa: is_reported, patient_name, patient_dni, study_type, status, created_on, flags.

_selection e is_reported son fijas. Las restantes se pueden ocultar y reordenar, pero debe quedar al menos una visible.

### Filtros

El panel report-filters-panel contiene:

- búsqueda general con InputSearch;
- autocompletes de grupo, modalidad y parte del cuerpo;
- checkboxes: listo para leer, incluir finalizados, asignados a mí, incluir sin imágenes, incluir sin orden CP y solo con notas;
- en administración: incluir sin finalizar;
- banderas roja, verde, azul y amarilla;
- fecha por admisión/reporte y rangos todo, día, 3/7/14 días, 1/2/3 meses o 1 año;
- presets que guardan filtros, columnas, orden, paginación y visibilidad;
- refresco manual.

En móvil se abre como drawer lateral con overlay, botón flotante morado y contador de filtros activos.

### Acciones normales

Definidas por getInformesActions:

| Acción | Condición |
|---|---|
| Redactar informe | reports.write; se deshabilita por límite mensual y se bloquea si otro usuario edita. |
| Ver imágenes | Solo is_image; abre visor DICOM y diferencia 403/404. |
| Ver PDF | Solo report_available. |
| Confirmar estudio | worklist.confirm_execute; deshabilitada con w_order === 1 o is_executed. |
| Asignar | reports.assign o *. |
| Ver/agregar notas | GeneralNotesCell; borrar requiere reports.notes.delete o *. |

Click normal selecciona. Ctrl/Cmd permite selección múltiple. Doble click intenta redactar si existe reports.write.

### Acciones administrativas

getAdministrativeInformesActions ofrece:

- ver imágenes si is_image;
- ver reporte si report_available;
- compartir imágenes si hay imagen y study_instance_uid;
- compartir estudio si hay study_instance_uid;
- ver/agregar notas, sin borrar desde esa vista.

### Selección masiva y endpoints

- El checkbox de cabecera solo opera sobre la página actual.
- guid es el identificador.
- additionalControls muestra contador y acciones: asignar, agregar tags y agregar banderas.
- Las operaciones batch envían una request por examen con Promise.allSettled.
- Tras completar se limpia la selección.
- Flags y tags usan actualización optimista con rollback ante error.

~~~text
POST   /api/reports/{exam_id}/assign
PATCH  /api/examinations/{exam_id}/flags
PATCH  /api/examinations/{exam_id}/tag_ids
POST   /api/examinations/{exam_id}/block
POST   /api/examinations/{exam_id}/unblock
POST   /api/examinations/{exam_id}/notes
GET    /api/examinations/{exam_id}/notes
DELETE /api/examinations/{exam_id}/notes/{note_id}
~~~

## 8. Otras tablas existentes

Usan TablaDynamic, salvo donde se indique lo contrario:

| Área | Tablas/datos |
|---|---|
| Redacción | Radiologia/informes, Imagenes/estudios PACS, EditarEstudioModal/tipos de estudio. |
| Estudios | Historial de estudios: fecha, tipo, recursos, visor, reporte, compartir y descarga. |
| Distribución | Fecha, paciente, examen, médicos, email, accession, urgencia y estado. |
| Pacientes | Búsqueda, historial, pacientes en admisión y agenda. |
| Administración | Demográficos, reasignación de exámenes, pacientes para reasignar y unificación. |
| Citas | Edición de citas y selección de pacientes. |
| Admisión | Pacientes y estudios. |
| Configuración/exámenes | Tipos de estudio, modalidades, partes del cuerpo, grupos y obras sociales. |
| Configuración/equipos | Máquinas y agendas de máquinas. |
| Configuración/institucional | Facilities, locations, obras sociales, tags, dominio de pacientes, parser-facility e historial de módulos. |
| Configuración/personal | Usuarios, pacientes, médicos solicitantes y agendas médicas. |
| Gestión | Accesos externos y logs de Clínica Parque. |
| Reportes estructurados | Lista de parser, mapeo de variables y conceptos/criterios. |

Tablas directas con Table:

- src/modules/admision/admision-cita/components/ModalAdmision.tsx: AE Title, descripción, modalidad y asignado.
- src/modules/citas/nueva-cita/components/Examen.tsx: código, descripción, modalidad, parte del cuerpo y grupo de estudio.

Estas dos no tienen por defecto filtros, orden, columnas configurables, copiar celdas ni paginación común.

## 9. Observaciones del código actual

1. mobileMode, mobileActions, mobileStatusKey y TableColumn.mobile existen en tipos y se pasan desde worklist, pero TablaDynamic no los consume. Hoy la adaptación móvil real es hideOnMobile, scroll vertical y paginador responsivo. Para cards hay que implementar un branch móvil real.
2. El contenedor interno de TablaDynamic usa overflow-x-hidden. Si una tabla necesita scroll horizontal hay que cambiar conscientemente este contrato.
3. Anchos y orden son estado local si no se proporcionan callbacks. Worklist los guarda en presets, no en almacenamiento global.
4. Selección y operaciones masivas se limitan a la página actual, no al total global.
5. El ancho de acciones es max(actions.length * 36 + 16, 140); se conservan placeholders para acciones ocultas.
6. No usar solo color para un estado clínico: añadir icono, texto, tooltip o title.
7. En una API paginada no usar serverSide: false ni slice salvo que se pretenda paginar localmente.

## 10. Checklist

- [ ] Definir tipo de fila e ID estable; usar rowIdKey si no es guid.
- [ ] Crear columns.tsx con keys, labels, flags de sort/filtro, anchos y render.
- [ ] Definir fallbacks para null, fechas, textos largos y booleanos.
- [ ] Separar acciones en TableAction[], condicionadas por datos y permisos.
- [ ] Añadir stopPropagation() a controles dentro de filas.
- [ ] Conectar page, per_page, total y reset a página 1.
- [ ] Conectar sort controlado si ordena el backend.
- [ ] Elegir filtro local o serverSideFiltering.
- [ ] Pasar columnas completas, visibles y fijas cuando corresponda.
- [ ] Validar light/dark, loading, vacío, errores, datos nulos, texto largo, muchas acciones y popovers.
- [ ] Validar teclado, foco visible, Enter, Escape y labels accesibles.
- [ ] Si se modifica código, ejecutar npm run typecheck, npm run lint y npm run build.
