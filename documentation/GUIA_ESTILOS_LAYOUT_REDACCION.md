# Guia de Estilos de Layout Redaccion

Esta guia define el formato visual y las clases base para replicar el layout usado en `Redactar Informe` y `Editar Informe Predefinido`.

## 1. Objetivo visual

- Contenedor principal sin scroll general de pagina.
- Scroll interno por columna (principal y sidebar).
- Encabezado fijo superior del modulo.
- Columna principal de redaccion con toolbar unica.
- Sidebar derecho colapsable con boton central.
- Paleta y bordes consistentes en modo claro y oscuro.

## 2. Estructura base

```tsx
<MainLayout isOverflow={false}>
  <div className="h-full min-h-0 bg-gray-50 dark:bg-[#0f1218] rounded-xl p-2 dark:text-gray-100 flex flex-col overflow-hidden">
    {/* Header */}
    <div className="flex justify-between items-center mb-3 shrink-0">...</div>

    {/* Body */}
    <div className="flex-1 min-h-0 relative">
      <div className="flex gap-1 h-full">
        {/* Columna principal */}
        <div className="flex-1 ... overflow-y-auto h-full table-scrollbar-purple">...</div>

        {/* Toggle central */}
        <div className="self-stretch hidden lg:block">...</div>

        {/* Sidebar derecho */}
        <div className="w-full lg:w-[360px] shrink-0 h-full overflow-y-auto table-scrollbar-purple">...</div>
      </div>
    </div>
  </div>
</MainLayout>
```

## 3. Bloque: contenedor raiz

Clase recomendada:

```txt
h-full min-h-0 bg-gray-50 dark:bg-[#0f1218] rounded-xl p-2 dark:text-gray-100 flex flex-col overflow-hidden
```

Reglas:

- Usar `h-full min-h-0` para convivir con el `Footer` de `MainLayout`.
- Evitar `100vh` directo si hay footer global.
- `overflow-hidden` en raiz para impedir scroll general.

## 4. Bloque: header del modulo

Contenedor externo:

```txt
flex justify-between items-center mb-3 shrink-0
```

Card de header:

```txt
relative bg-white dark:bg-[#151922] rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 w-full
```

Acciones principales (guardar, volver, etc.):

- Boton primario visual:
```txt
bg-brand-purple border-brand-purple text-white hover:bg-brand-purple/90
```

## 5. Bloque: area de columnas

Wrapper:

```txt
flex-1 min-h-0 relative
```

Fila de columnas:

```txt
flex gap-1 h-full
```

Notas:

- `h-full` + `min-h-0` es obligatorio para que el scroll sea interno.
- No usar margenes verticales grandes dentro de esta zona.

## 6. Bloque: columna principal de redaccion

Clase completa:

```txt
flex-1 space-y-2.5 p-2.5 transition-all ease-in-out min-w-0 bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto h-full table-scrollbar-purple
```

Incluye:

- Toolbar global sticky.
- Cards de secciones (Tecnica, Hallazgos, Impresiones, Conclusiones).

## 7. Bloque: toolbar unica

```txt
sticky top-0 z-20 bg-gray-50 dark:bg-[#0f1218] rounded-md border border-gray-200 dark:border-gray-700 p-1.5 flex items-center gap-0.5 flex-wrap
```

Boton normal:

```txt
p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600
```

Boton activo:

```txt
bg-gray-300 dark:bg-gray-600
```

## 8. Bloque: card de seccion editable

Card:

```txt
bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden p-0
```

Header de card:

```txt
cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700
```

Titulo:

```txt
text-gray-800 dark:text-gray-100 font-semibold
```

Icono collapse:

```txt
w-4 h-4 text-gray-700 dark:text-gray-300
```

Contenedor expandible:

```txt
transition-all duration-300 ease-in-out overflow-hidden
```

Estado abierto sugerido:

```txt
max-h-[3000px] opacity-100
```

Estado cerrado:

```txt
max-h-0 opacity-0
```

## 9. Bloque: toggle central del sidebar

Wrapper:

```txt
self-stretch hidden lg:block
```

Boton:

```txt
bg-gray-200 dark:bg-[#1f2937] h-full hover:bg-gray-300 dark:hover:bg-[#2a3444] text-gray-700 dark:text-gray-200 p-1.5 rounded-md border border-gray-300 dark:border-gray-700 transition-colors
```

Uso:

- Colocar entre columna principal y sidebar derecho.
- Mostrar solo en `lg` para evitar problemas en mobile.

## 10. Bloque: sidebar derecho

Contenedor:

```txt
w-full lg:w-[360px] shrink-0 h-full overflow-y-auto table-scrollbar-purple
```

### 10.1 Tabs del sidebar

Barra tabs:

```txt
bg-gray-100 dark:bg-[#1e2430] px-2 py-2 border-b border-gray-200 dark:border-gray-700
```

Grid tabs:

```txt
grid grid-cols-3 gap-1
```

Tab activa:

```txt
bg-white dark:bg-[#151922] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700
```

Tab inactiva:

```txt
text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#273043]
```

Boton tab base:

```txt
px-2 py-1.5 rounded-md text-xs font-semibold transition-colors
```

### 10.2 Contenido de tabs

- `Informacion general`: input titulo, autocomplete tipo estudio, checkbox default.
- `Variables estructuradas`: textarea simple o editor rico.
- `Criterios`: textarea simple o editor rico.

Textarea recomendada:

```txt
w-full min-h-[120px] p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e2430] text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-brand-purple/40
```

## 11. Scroll y overflow (regla clave)

Para evitar scroll general:

- Raiz del modulo con `overflow-hidden`.
- Area interna con `flex-1 min-h-0`.
- Columnas con `h-full overflow-y-auto`.

Checklist:

- Existe un unico scroll en columna principal.
- Sidebar puede tener su propio scroll si su contenido excede altura.
- La pagina completa no debe moverse verticalmente al editar.

## 12. Responsive

- En mobile, usar stack vertical: `w-full` para sidebar.
- Ocultar toggle central con `hidden lg:block`.
- Mantener toolbar con `flex-wrap` para evitar overflow horizontal.

## 13. Fragmentos reutilizables

### 13.1 Clase util para panel base

```ts
const panelBase = "bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden";
```

### 13.2 Clase util para header de panel

```ts
const panelHeader = "cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700";
```

### 13.3 Clase util para scroll interno

```ts
const innerScroll = "h-full overflow-y-auto table-scrollbar-purple";
```

## 14. Convenciones de implementacion

- Mantener mismo sistema de colores en todos los modulos de redaccion.
- Reutilizar iconos `ChevronUp/ChevronDown` para expandibles.
- Preferir una sola toolbar global cuando haya multiples editores.
- Evitar mezclar encabezados morados y grises en la misma vista si se busca paridad con `Redactar Informe`.

## 15. Referencia de implementacion

- `src/modules/redaccion/Radiologia/redactar-informe/RedactarInforme.tsx`
- `src/modules/redaccion/informe-predefinidos/crear-informe/CrearInforme.tsx`
