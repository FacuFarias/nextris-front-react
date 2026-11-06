import { createBrowserRouter, RouterProvider, Outlet, Navigate, useLocation, useMatches } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAnalytics } from "@/context/AnalyticsContext";
import { useAuth } from "@/context/AuthContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { brand } from "@/lib/brand";
import { BridgeWidget } from "@/assistant/BridgeWidget";

// Rutas de autenticación — cargadas de forma eager (necesarias en el arranque)
import { Login } from "@/modules/auth/login/Login";
import { ChangePassword } from "@/modules/auth/change-password/ChangePassword";

// Cada edición tiene una sola pantalla de carga; la ruta de la otra redirige a ella.
function StudyUploadRoute({ legacyPath = false }: { legacyPath?: boolean }) {
    const { config } = useAppConfig();
    if (!config) return null;
    const veterinary = config.patient_mode === "veterinary";
    if (veterinary) return legacyPath ? <Navigate to="/cargar-estudio" replace /> : <VeterinaryUpload />;
    return legacyPath ? <CargarEstudios /> : <Navigate to="/gestion/cargar-estudios" replace />;
}

// ── Page-view tracker ─────────────────────────────────────────────────────────
// Mounted as the root layout element so it lives inside the RouterProvider
// tree and can call useLocation(). A ref guard avoids StrictMode double-fire.
function RootLayout() {
    const location = useLocation();
    const matches = useMatches();
    const pageTitle = matches
        .map((match) => (match.handle as { title?: string } | undefined)?.title)
        .filter((title): title is string => Boolean(title))
        .at(-1);

    useEffect(() => {
        document.title = pageTitle ? `${brand.name} - ${pageTitle}` : brand.name;
    }, [pageTitle]);
    const { track } = useAnalytics();
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        if (lastPath.current === location.pathname) return;
        lastPath.current = location.pathname;
        track("$pageview", { path: location.pathname, search: location.search });
    }, [location.pathname, location.search, track]);

    return <><Outlet />{import.meta.env.VITE_MCP_BRIDGE_ENABLED === 'true' && <BridgeWidget />}</>;
}

// El resto se carga sólo cuando se navega a la ruta (lazy)
const Inicio = lazy(() => import("@/modules/inicio/Inicio").then(m => ({ default: m.Inicio })));
const BuscarPaciente = lazy(() => import("@/modules/pacientes").then(m => ({ default: m.BuscarPaciente })));
const HistorialPaciente = lazy(() => import("@/modules/pacientes").then(m => ({ default: m.HistorialPaciente })));
const AdmisionCita = lazy(() => import("@/modules/admision").then(m => ({ default: m.AdmisionCita })));
const AdmisionEspontanea = lazy(() => import("@/modules/admision").then(m => ({ default: m.AdmisionEspontanea })));
const NuevaCita = lazy(() => import("@/modules/citas").then(m => ({ default: m.NuevaCita })));
const EditarCita = lazy(() => import("@/modules/citas").then(m => ({ default: m.EditarCita })));
const EditarFecha = lazy(() => import("@/modules/citas").then(m => ({ default: m.EditarFecha })));
const Worklist = lazy(() => import("@/modules/worklist").then(m => ({ default: m.Worklist })));
const AdministrativeView = lazy(() => import("@/modules/worklist").then(m => ({ default: m.AdministrativeView })));
const InformePredefinidos = lazy(() => import("@/modules/gestion").then(m => ({ default: m.InformePredefinidos })));
const Imagenes = lazy(() => import("@/modules/imagenes").then(m => ({ default: m.Imagenes })));
const Distribucion = lazy(() => import("@/modules/distribucion").then(m => ({ default: m.Distribucion })));
const RedactarInforme = lazy(() => import("@/modules/worklist").then(m => ({ default: m.RedactarInforme })));
const ConfiguracionTablas = lazy(() => import("@/modules/configuracion/configuracion-tablas/ConfiguracionTablas").then(m => ({ default: m.ConfiguracionTablas })));
const Estudios = lazy(() => import("@/modules/estudios/Estudios").then(m => ({ default: m.Estudios })));
const CaseLink = lazy(() => import("@/modules/case-link").then(m => ({ default: m.CaseLink })));
const MisDatos = lazy(() => import("@/modules/mis-datos/MisDatos").then(m => ({ default: m.MisDatos })));
const CrearInforme = lazy(() => import("@/modules/gestion").then(m => ({ default: m.CrearInforme })));
const UnificacionPaciente = lazy(() => import("@/modules/administracion/unificacion-paciente/UnificacionPaciente").then(m => ({ default: m.UnificacionPaciente })));
const ReasignacionExamenes = lazy(() => import("@/modules/administracion/reasignacion-examenes/ReasignacionExamenes").then(m => ({ default: m.ReasignacionExamenes })));
const CargarEstudios = lazy(() => import("@/modules/gestion").then(m => ({ default: m.CargarEstudios })));
const VeterinaryUpload = lazy(() => import("@/modules/veterinary/VeterinaryUpload").then(m => ({ default: m.VeterinaryUpload })));
const AccesosExternos = lazy(() => import("@/modules/gestion/accesos-externos").then(m => ({ default: m.AccesosExternos })));
// structured_reports — deshabilitado temporalmente
// nexi — deshabilitado temporalmente

const Ejecucion = lazy(() => import("@/modules/ejecucion/Ejecucion").then(m => ({ default: m.Ejecucion })));

const DetalleEjecucion = lazy(() => import("@/modules/ejecucion/detalle-ejecucion/DetalleEjecucion").then(m => ({ default: m.DetalleEjecucion })));

const ReportesEstructurados = lazy(() => import("@/modules/reportes-estructurados/ReportesEstructurados").then(m => ({ default: m.ReportesEstructurados })));

const Nexi = lazy(() => import("@/modules/nexi/Nexi").then(m => ({ default: m.Nexi })));

const LocalReportPage = lazy(() => import("@/modules/estudios/LocalReportPage").then(m => ({default: m.LocalReportPage})));

const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

function RequireSession() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <PageLoader />;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
    {
        // RootLayout wraps every route so PageViewTracker has useLocation access
        element: <RootLayout />,
        children: [
    {
        path: "/",
        handle: { title: "Iniciar sesión" },
        element: <Login />,
    },
    {
        path: "/login",
        handle: { title: "Iniciar sesión" },
        element: <Login />,
    },
    {
        path: "/pacientes",
        handle: { title: "Portal de pacientes" },
        element: <Login initialIsPatient={true} />,
    },
    {
        path: "/login/pacientes",
        handle: { title: "Portal de pacientes" },
        element: <Login initialIsPatient={true} />,
    },
    {
        element: <RequireSession />,
        children: [
    {path: '/informes/:examId', element: <ProtectedRoute requiredPermissions={['reports.write','patients.view','distribution.view','tabs.worklist.view']}><LocalReportPage /></ProtectedRoute>},
    {path: '/ejecucion', element: <ProtectedRoute requiredPermissions={['tabs.worklist.view']}><Ejecucion /></ProtectedRoute>},
    {path: '/ejecucion/detalle/:guid', element: <ProtectedRoute requiredPermissions={['worklist.confirm_execute']}><DetalleEjecucion /></ProtectedRoute>},
    {path: '/nexi', element: <ProtectedRoute requiredPermissions={['tabs.nexi.view']}><Nexi /></ProtectedRoute>},
    {path: '/reportes-estructurados/lista-parser', element: <ProtectedRoute requiredPermissions={['tabs.structured_reports.view']}><ReportesEstructurados /></ProtectedRoute>},
    {path: '/reportes-estructurados/mapeo-variables', element: <ProtectedRoute requiredPermissions={['tabs.structured_reports.view']}><ReportesEstructurados /></ProtectedRoute>},
    {path: '/reportes-estructurados/conceptos-criterios', element: <ProtectedRoute requiredPermissions={['tabs.structured_reports.view']}><ReportesEstructurados /></ProtectedRoute>},
    {path: '/reportes-estructurados/plantillas-inteligentes', element: <ProtectedRoute requiredPermissions={['tabs.structured_reports.view']}><ReportesEstructurados /></ProtectedRoute>},
    {
        path: "/inicio",
        handle: { title: "Inicio" },
        element: (
            <ProtectedRoute allowWithoutPermissions>
                <Inicio />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cambiar-password",
        handle: { title: "Cambiar contraseña" },
        element: (
            <ProtectedRoute allowWithoutPermissions>
                <ChangePassword />
            </ProtectedRoute>
        ),
    },
    {/*buscar pacientes*/ },
    {
        path: "/buscar-pacientes",
        handle: { title: "Pacientes" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"]}
                requiredPermissions={["patients.view"]}
            >
                <BuscarPaciente />
            </ProtectedRoute>
        ),
    },
    {
        path: "/buscar-pacientes/historial-paciente",
        handle: { title: "Historial del paciente" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"]}
                requiredPermissions={["patients.view"]}
            >
                <HistorialPaciente />
            </ProtectedRoute>
        ),
    },

    {/*citas*/ },
    {
        path: "/cita/nueva-cita",
        handle: { title: "Nueva cita" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo", "Administrador"]}
                requiredPermissions={["tabs.appointments.view", "appointments.create"]}
                requiredModule="appointments"
            >
                <NuevaCita />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cita/editar-cita",
        handle: { title: "Editar cita" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo", "Administrador"]}
                requiredPermissions={["tabs.appointments.view", "appointments.view"]}
                requiredModule="appointments"
            >
                <EditarCita />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cita/editar-cita/:id",
        handle: { title: "Editar fecha de cita" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo", "Administrador"]}
                requiredPermissions={["tabs.appointments.view", "appointments.view"]}
                requiredModule="appointments"
            >
                <EditarFecha />
            </ProtectedRoute>
        ),
    },


    {/*Admision*/ },

    {
        path: "/nueva-admision",
        handle: { title: "Admisión de cita" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo", "Administrador"]}
                requiredPermissions={["tabs.admissions.view", "admissions.view", "admissions.admit_appointments"]}
                requiredModule="appointments"
            >
                <AdmisionCita />
            </ProtectedRoute>
        ),
    },
    {
        path: "/admision-espontanea",
        handle: { title: "Admisión espontánea" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo", "Administrador", "Medico"]}
                requiredPermissions={["tabs.admissions.view", "admissions.view", "admissions.create_spontaneous"]}
            >
                <AdmisionEspontanea />
            </ProtectedRoute>
        ),
    },
    {/* Lista de trabajo */ },
    {
        path: "/worklist",
        handle: { title: "Lista de trabajo" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrador"]}
                requiredPermissions={["tabs.worklist.view"]}
            >
                <Worklist />
            </ProtectedRoute>
        ),
    },
    {
        path: "/administrative_view",
        handle: { title: "Vista administrativa" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrador", "Administrativo"]}
                requiredPermissions={["tabs.worklist.view"]}
            >
                <AdministrativeView />
            </ProtectedRoute>
        ),
    },
    {
        path: "/worklist/redactar-informe/:informeGuid/:studyInstanceUID?",
        handle: { title: "Redactar informe" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["reports.write"]}
            >
                <RedactarInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/gestion/informes-predefinidos",
        handle: { title: "Informes predefinidos" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["templates.manage"]}
            >
                <InformePredefinidos />
            </ProtectedRoute>
        ),
    },
    {
        path: "/gestion/crear-informe",
        handle: { title: "Crear informe" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["templates.manage"]}
            >
                <CrearInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/gestion/editar-informe/:id",
        handle: { title: "Editar informe" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["templates.manage"]}
            >
                <CrearInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cargar-estudio",
        handle: { title: "Cargar Estudio" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["dicom.studies.manage"]}
            >
                <StudyUploadRoute />
            </ProtectedRoute>
        ),
    },
    {
        path: "/gestion/cargar-estudios",
        handle: { title: "Cargar estudios" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["dicom.studies.manage"]}
            >
                <StudyUploadRoute legacyPath />
            </ProtectedRoute>
        ),
    },
    {
        path: "/gestion/accesos-externos",
        handle: { title: "Accesos externos" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrador"]}
                requiredPermissions={["tabs.gestion.view"]}
            >
                <AccesosExternos />
            </ProtectedRoute>
        ),
    },
    {
        path: "/imagenes",
        handle: { title: "Imágenes" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrador"]}
                requiredPermissions={["images.view"]}
            >
                <Imagenes />
            </ProtectedRoute>
        ),
    },

    {/*Distribucion*/ },
    {
        path: "/distribucion",
        handle: { title: "Distribución" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo", "Administrador", "Medico"]}
                requiredPermissions={["distribution.view"]}
            >
                <Distribucion />
            </ProtectedRoute>
        ),
    },

    {/*Configuraciones*/ },
    {
        path: "/configuraciones/tablas",
        handle: { title: "Configuración de tablas" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Admin", "Administrador"]}
                requiredPermissions={["tabs.config.view", "users.manage", "users.permissions.manage", "users.impersonate"]}
            >
                <ConfiguracionTablas />
            </ProtectedRoute>
        ),
    },
    {/*Administracion*/ },

    {
        path: "/administracion/unificacion-paciente",
        handle: { title: "Unificación de pacientes" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrador"]}
                requiredPermissions={["tabs.gestion.view"]}
            >
                <UnificacionPaciente />
            </ProtectedRoute>
        ),
    },
    {
        path: "/administracion/reasignacion-examenes",
        handle: { title: "Reasignación de exámenes" },
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrador"]}
                requiredPermissions={["tabs.gestion.view"]}
            >
                <ReasignacionExamenes />
            </ProtectedRoute>
        ),
    },
    // DEPRECATED: Demográficos
    // {
    //     path: "/administracion/demograficos",
    //     element: (
    //         <ProtectedRoute
    //             allowedRoles={["Sysadmin", "Administrador"]}
    //             requiredPermissions={["tabs.gestion.view"]}
    //         >
    //             <Demograficos />
    //         </ProtectedRoute>
    //     ),
    // },
    {/*Mis estudios pacientes*/ },
    {
        path: "/estudios",
        handle: { title: "Mis estudios" },
        element: (
            <ProtectedRoute allowedRoles={["patient"]} requiredModule="patient_portal">
                <Estudios />
            </ProtectedRoute>
        ),
    },
    {
        path: "/mis-datos",
        handle: { title: "Mis datos" },
        element: (
            <ProtectedRoute allowedRoles={["patient"]} requiredModule="patient_portal">
                <MisDatos />
            </ProtectedRoute>
        ),
    },
    // Explicit redirects for retired screens avoid rendering a router error page.

        ],
    },
    {
        path: "/case/:shortCode",
        handle: { title: "Estudio compartido" },
        element: <CaseLink />,
    },
        ], // end children of RootLayout
    },   // end root route
]);

export const AppRoutes = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <RouterProvider router={router} />
        </Suspense>
    );
};
