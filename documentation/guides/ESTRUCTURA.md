# NextRIS Frontend - Estructura del Proyecto

## Resumen General

**Proyecto:** NextRIS (Next Radiology Information System)
**Tipo:** Sistema de gestión radiológica / healthcare
**Stack:** React 19 + TypeScript 5.9 + Vite 7
**API Backend:** `http://148.230.72.8:5001/api`

---

## Stack Tecnológico

| Aspecto | Tecnología |
|---------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 7 |
| Routing | React Router DOM v6 |
| Estado global | Context API (auth) |
| Estado servidor | TanStack React Query v5 |
| HTTP Client | Axios (con refresh token automático) |
| Formularios | React Hook Form + Zod |
| UI Components | shadcn/ui (Radix UI) |
| Estilos | Tailwind CSS v4 |
| Editor de texto | TipTap |
| Calendario | FullCalendar |
| Iconos | Lucide React |
| Notificaciones | Sonner (toasts) |

---

## Estructura de Directorios

```
src/
├── main.tsx                    # Entry point (AuthProvider > QueryClientProvider > App)
├── App.tsx                     # Componente raíz
├── index.css                   # Estilos globales + variables CSS + Tailwind
│
├── context/
│   └── AuthContext.tsx          # Estado de autenticación (login, logout, token)
│
├── routes/
│   ├── Routes.tsx               # Definición de todas las rutas
│   └── ProtectedRoute.tsx       # Guard: redirige a login si no autenticado
│
├── lib/
│   ├── api.ts                   # Axios config + interceptores (token, refresh)
│   ├── queryClient.ts           # React Query config
│   ├── utils.ts                 # cn() (clsx + tw-merge), stripHtmlTags()
│   └── fechaYhora.ts            # Utilidades de fecha/hora
│
├── layouts/
│   ├── layout.tsx               # MainLayout (sidebar + content + footer)
│   ├── Sidebar.tsx              # Sidebar de navegación con filtro por rol
│   ├── Footer.tsx               # Footer
│   └── LayoutSinSidebar.tsx     # Layout alternativo (login)
│
├── components/
│   ├── ui/                      # ~20 componentes shadcn/Radix (button, input, dialog, etc.)
│   ├── TableDynamic.tsx         # Tabla genérica con sort, paginación, acciones
│   ├── RichTextEditor.tsx       # Editor TipTap (bold, italic, imágenes, etc.)
│   ├── Modal.tsx                # Modal reutilizable
│   ├── Pagination.tsx           # Control de paginación
│   ├── InputSearch.tsx          # Input de búsqueda con debounce
│   ├── DynamicBreadcrumb.tsx    # Breadcrumbs automáticos
│   ├── DireccionSelector.tsx    # Selector de ubicación
│   ├── autocomplete.tsx         # Dropdown autocompletado
│   ├── IsAdmin.tsx              # Render condicional por rol
│   ├── PrimaryButton.tsx        # Botón primario estilizado
│   ├── SecondaryButton.tsx      # Botón secundario estilizado
│   └── BackgroundEffects.tsx    # Fondo animado
│
├── services/                    # Servicios globales de API
│   ├── api-global.service.ts    # Modalidades, partes del cuerpo, equipos, médicos, etc.
│   ├── patient-domains.service.ts
│   ├── transcription.service.ts # Transcripción de audio
│   └── institutional-locations.service.ts
│
├── hooks/                       # Hooks globales (wrappers de React Query)
│   ├── use-global.tsx           # useModalidades, usePartesDelCuerpo, useEquipos, etc.
│   ├── use-patients-domains.tsx
│   ├── use-locations.tsx
│   └── use-audio-recorder.tsx
│
├── types/
│   ├── global.type.ts           # Tipos globales (Modalidad, Equipo, Medico, etc.)
│   └── table.ts                 # Tipos de tabla
│
├── constants/
│   └── query-keys.ts            # Claves de React Query (globalKeys, patientsKeys)
│
├── assets/                      # Imágenes, logos, fondos
│
└── modules/                     # 12 módulos de funcionalidad
    ├── auth/                    # Autenticación
    ├── inicio/                  # Dashboard principal
    ├── pacientes/               # Gestión de pacientes
    ├── citas/                   # Gestión de citas
    ├── admision/                # Admisiones
    ├── ejecucion/               # Ejecución de estudios
    ├── redaccion/               # Redacción de informes + plantillas
    ├── distribucion/            # Distribución de informes
    ├── estudios/                # Estudios del paciente
    ├── mis-datos/               # Perfil de usuario
    ├── administracion/          # Admin (unificación, reasignación)
    └── configuracion/           # Config (exámenes, equipos, usuarios)
```

---

## Patrón de Módulos

Cada módulo sigue la misma estructura interna:

```
modules/[nombre-modulo]/
├── NombreModulo.tsx             # Componente página principal
├── components/
│   ├── FeatureComponent.tsx     # Componentes específicos del módulo
│   └── columns.tsx              # Definición de columnas para TableDynamic
├── hooks/
│   └── use-feature.tsx          # Queries y mutations (React Query)
├── services/
│   └── feature.service.ts       # Llamadas API con Axios
├── types/
│   └── Feature.ts               # Tipos TypeScript
├── schemas/
│   └── feature.schema.ts        # Validación Zod
├── constants/
│   └── query-keys.ts            # Claves de query del módulo
└── [sub-módulos]/               # Sub-páginas opcionales
```

---

## Módulos del Sistema

### 1. `auth/login/` - Autenticación
- Login dual: paciente y personal médico
- Form con React Hook Form + Zod
- Guarda tokens en localStorage

### 2. `inicio/` - Dashboard
- Página de bienvenida con grid de acciones disponibles
- Muestra info del usuario

### 3. `pacientes/buscar-paciente/` - Gestión de Pacientes
- Búsqueda con debounce (300ms)
- CRUD completo (crear, editar, eliminar)
- Paginación server-side (8 items/página)
- Sub-módulo: `historial-paciente/` (historial y estudios)

### 4. `citas/` - Citas
- `nueva-cita/` - Agendar cita nueva
- `editar-cita/` - Editar cita existente
- Integración con ubicaciones y médicos

### 5. `admision/` - Admisiones
- `admision-cita/` - Admisión por cita programada
- `admision-espontanea/` - Admisión sin cita previa
- Integración con obras sociales, equipos y modalidades

### 6. `ejecucion/` - Ejecución de Estudios
- Lista de estudios pendientes de ejecución
- `detalle-ejecucion/` - Detalle por GUID
- Tracking de instancias de estudio

### 7. `redaccion/` - Redacción de Informes
- `Radiologia/` - Editor de informes con TipTap
  - Firma digital (SignModal)
  - Plantillas (TemplateModal)
  - Addendums
  - Próximo examen
- `informe-predefinidos/` - CRUD de plantillas de informe
- `cargar-estudios/` - Carga de estudios

### 8. `distribucion/` - Distribución
- Distribución de informes a médicos/pacientes
- Tracking de estado

### 9. `estudios/` - Estudios (Portal Paciente)
- Vista de estudios del paciente logueado

### 10. `mis-datos/` - Perfil
- Ver/editar datos personales del usuario

### 11. `administracion/` - Administración
- `unificacion-paciente/` - Fusionar pacientes duplicados
- `reasignacion-examenes/` - Reasignar estudios entre pacientes

### 12. `configuracion/` - Configuración
- `examenes/` - Tipos de examen
- `equipos/` - Equipos médicos
- `institucional/` - Configuración institucional
- `usuarios-personal/` - Gestión de usuarios

---

## Rutas

```
PÚBLICAS:
/                                → Login
/login                           → Login

PROTEGIDAS (requieren autenticación):
/inicio                          → Dashboard
/pacientes                       → Búsqueda de pacientes
/pacientes/historial-paciente    → Historial del paciente
/cita/nueva-cita                 → Nueva cita
/cita/editar-cita                → Editar cita
/cita/editar-cita/:id            → Editar fecha de cita
/nueva-admision                  → Admisión por cita
/admision-espontanea             → Admisión espontánea
/ejecucion                       → Ejecución de estudios
/ejecucion/detalle/:guid         → Detalle de ejecución
/estudios/redaccion              → Lista de informes
/estudios/redaccion/redactar-informe/:informeGuid/:studyInstanceUID
                                 → Redactar informe
/estudios/informes-predefinidos  → Plantillas
/estudios/crear-informe          → Crear plantilla
/estudios/editar-informe/:id     → Editar plantilla
/estudios/cargar-estudios        → Cargar estudios
/distribucion                    → Distribución
/configuraciones/tablas          → Configuración de tablas
/administracion/unificacion-paciente   → Unificación
/administracion/reasignacion-examenes  → Reasignación
/estudios                        → Estudios (paciente)
/mis-datos                       → Perfil
```

---

## Flujo de Autenticación

```
1. Usuario ingresa credenciales en LoginCard
2. React Hook Form valida con Zod (username, password requeridos)
3. useLogin() → POST /auth/login { username, password, user_type }
4. Backend responde { access_token, refresh_token, user }
5. AuthContext.login() guarda en localStorage
6. Redirect a /inicio

Token refresh automático:
- Interceptor de Axios detecta 401
- Llama a POST /auth/refresh con refresh_token
- Reintenta la request original con nuevo token
- Si falla el refresh → redirect a login
```

### Roles de Usuario

| Tipo | Acceso |
|------|--------|
| `Sysadmin` | Acceso completo |
| `staff` | Personal médico |
| `patient` | Portal de paciente |

El `Sidebar.tsx` filtra opciones de menú según `user_type`. `IsAdmin` controla renders condicionales.

---

## Patrones Clave del Código

### Servicio API (Axios)
```typescript
// lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});
// Interceptor añade Bearer token automáticamente
// Interceptor de response maneja refresh de token
```

### Hook de Query (lectura)
```typescript
export const useFeature = (params) => {
  const { data, isLoading } = useQuery({
    queryKey: featureKeys.list(params),
    queryFn: () => featureService.getAll(params),
  });
  return { data, isLoading };
};
```

### Hook de Mutation (escritura)
```typescript
export const useCreateFeature = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => featureService.create(data),
    onSuccess: () => {
      toast.success("Creado correctamente");
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
    },
    onError: (error) => toast.error(error?.response?.data?.message),
  });
};
```

### Respuesta típica del API
```typescript
{
  success: boolean,
  data: {
    data: T[],         // datos
    page: number,
    per_page: number,
    total: number,
    timezone: string
  }
}
```

### Componente de página típico
```tsx
export const FeaturePage = () => {
  const { data, isLoading } = useFeature(params);
  return (
    <MainLayout>
      <DynamicBreadcrumb />
      {isLoading ? <Spinner /> : <TableDynamic data={data} columns={columns} />}
    </MainLayout>
  );
};
```

---

## Jerarquía de Componentes

```
main.tsx
└── AuthProvider (Context)
    └── QueryClientProvider (React Query)
        └── Toaster (Sonner)
            └── App
                └── AppRoutes
                    ├── Login (público)
                    └── ProtectedRoute (verificación de auth)
                        └── MainLayout
                            ├── Sidebar (navegación + filtro por rol)
                            ├── DynamicBreadcrumb
                            ├── [Contenido del módulo]
                            └── Footer
```

---

## Variables de Entorno (.env)

```
VITE_API_URL=http://148.230.72.8:5001/api
VITE_APP_NAME=NextRIS
VITE_APP_VERSION=1.0.0
```

---

## Scripts Disponibles

```bash
npm run dev       # Servidor de desarrollo (Vite + HMR)
npm run build     # Compilar TypeScript + bundle Vite → dist/
npm run lint      # Linting con ESLint
npm run preview   # Preview del build de producción
```

---

## Diseño Visual

- **Color principal:** `#440f6d` (brand-purple)
- **Gradiente:** De `#2D1B4E` a `#1a0f2e`
- **Espacio de color:** OKLch
- **Soporte dark mode:** Toggle via clase `.dark`
- **Responsive:** Mobile-first con breakpoints de Tailwind
- **Sidebar:** Fija en desktop (64px), toggle en mobile