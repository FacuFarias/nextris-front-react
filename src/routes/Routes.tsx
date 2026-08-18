import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAnalytics } from "@/context/AnalyticsContext";

// Rutas de autenticación — cargadas de forma eager (necesarias en el arranque)
import { Login } from "@/modules/auth/login/Login";
import { ChangePassword } from "@/modules/auth/change-password/ChangePassword";

// ── Page-view tracker ─────────────────────────────────────────────────────────
// Mounted as the root layout element so it lives inside the RouterProvider
// tree and can call useLocation(). A ref guard avoids StrictMode double-fire.
function RootLayout() {
    const location = useLocation();
    const { track } = useAnalytics();
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        if (lastPath.current === location.pathname) return;
        lastPath.current = location.pathname;
        track("$pageview", { path: location.pathname, search: location.search });
    }, [location.pathname, location.search, track]);

    return <Outlet />;
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
const Ejecucion = lazy(() => import("@/modules/ejecucion/Ejecucion").then(m => ({ default: m.Ejecucion })));
const DetalleEjecucion = lazy(() => import("@/modules/ejecucion/detalle-ejecucion/DetalleEjecucion").then(m => ({ default: m.DetalleEjecucion })));
const Radiologia = lazy(() => import("@/modules/redaccion").then(m => ({ default: m.Radiologia })));
const InformePredefinidos = lazy(() => import("@/modules/redaccion").then(m => ({ default: m.InformePredefinidos })));
const Imagenes = lazy(() => import("@/modules/redaccion/Imagenes/Imagenes").then(m => ({ default: m.Imagenes })));
const Distribucion = lazy(() => import("@/modules/distribucion").then(m => ({ default: m.Distribucion })));
const RedactarInforme = lazy(() => import("@/modules/redaccion/Radiologia/redactar-informe/RedactarInforme").then(m => ({ default: m.RedactarInforme })));
const ConfiguracionTablas = lazy(() => import("@/modules/configuracion/configuracion-tablas/ConfiguracionTablas").then(m => ({ default: m.ConfiguracionTablas })));
const Estudios = lazy(() => import("@/modules/estudios/Estudios").then(m => ({ default: m.Estudios })));
const MisDatos = lazy(() => import("@/modules/mis-datos/MisDatos").then(m => ({ default: m.MisDatos })));
const CrearInforme = lazy(() => import("@/modules/redaccion/informe-predefinidos/crear-informe/CrearInforme").then(m => ({ default: m.CrearInforme })));
const UnificacionPaciente = lazy(() => import("@/modules/administracion/unificacion-paciente/UnificacionPaciente").then(m => ({ default: m.UnificacionPaciente })));
const ReasignacionExamenes = lazy(() => import("@/modules/administracion/reasignacion-examenes/ReasignacionExamenes").then(m => ({ default: m.ReasignacionExamenes })));
const CargarEstudios = lazy(() => import("@/modules/redaccion/cargar-estudios/CargarEstudios").then(m => ({ default: m.CargarEstudios })));
// structured_reports — deshabilitado temporalmente
// const ReportesEstructurados = lazy(() => import("@/modules/reportes-estructurados/ReportesEstructurados").then(m => ({ default: m.ReportesEstructurados })));
// nexi — deshabilitado temporalmente
// const Nexi = lazy(() => import("@/modules/nexi/Nexi").then(m => ({ default: m.Nexi })));

const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

const router = createBrowserRouter([
    {
        // RootLayout wraps every route so PageViewTracker has useLocation access
        element: <RootLayout />,
        children: [
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/pacientes",
        element: <Login initialIsPatient={true} />,
    },
    {
        path: "/login/pacientes",
        element: <Login initialIsPatient={true} />,
    },
    {
        path: "/inicio",
        element: (
            <ProtectedRoute allowWithoutPermissions>
                <Inicio />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cambiar-password",
        element: (
            <ProtectedRoute allowWithoutPermissions>
                <ChangePassword />
            </ProtectedRoute>
        ),
    },
    {/*buscar pacientes*/ },
    {
        path: "/buscar-pacientes",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"]}
                requiredPermissions={["tabs.patients.view", "patients.view"]}
            >
                <BuscarPaciente />
            </ProtectedRoute>
        ),
    },
    {
        path: "/buscar-pacientes/historial-paciente",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"]}
                requiredPermissions={["tabs.patients.view", "patients.view"]}
            >
                <HistorialPaciente />
            </ProtectedRoute>
        ),
    },

    {/*citas*/ },
    {
        path: "/cita/nueva-cita",
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
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo", "Administrador", "Medico"]}
                requiredPermissions={["tabs.admissions.view", "admissions.view", "admissions.create_spontaneous"]}
            >
                <AdmisionEspontanea />
            </ProtectedRoute>
        ),
    },
    {/*Ejecucion*/ },
    {
        path: "/ejecucion",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Tecnico", "Administrador"]}
                requiredPermissions={["tabs.execution.view", "execution.view_pending"]}
            >
                <Ejecucion />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ejecucion/detalle/:guid",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Tecnico", "Administrador"]}
                requiredPermissions={["tabs.execution.view", "execution.view_pending"]}
            >
                <DetalleEjecucion />
            </ProtectedRoute>
        ),
    },
    {/*Redaccion*/ },
    {
        path: "/estudios/redaccion",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador", "Administrativo"]}
                requiredPermissions={["tabs.reports.view", "reports.view_writing"]}
            >
                <Radiologia />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/redaccion/redactar-informe/:informeGuid/:studyInstanceUID?",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["tabs.reports.view", "reports.view_writing"]}
            >
                <RedactarInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/informes-predefinidos",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["tabs.reports.view", "reports.view_reports"]}
            >
                <InformePredefinidos />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/crear-informe",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["tabs.reports.view", "reports.view_reports"]}
            >
                <CrearInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/editar-informe/:id",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["tabs.reports.view", "reports.view_reports"]}
            >
                <CrearInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/cargar-estudios",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Administrador"]}
                requiredPermissions={["tabs.reports.view", "reports.view_writing"]}
            >
                <CargarEstudios />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/imagenes",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrador"]}
                requiredPermissions={["tabs.images.view", "images.view"]}
            >
                <Imagenes />
            </ProtectedRoute>
        ),
    },

    {/*Distribucion*/ },
    {
        path: "/distribucion",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo", "Administrador", "Medico"]}
                requiredPermissions={["tabs.distribution.view", "distribution.view"]}
            >
                <Distribucion />
            </ProtectedRoute>
        ),
    },

    {/*Configuraciones*/ },
    {
        path: "/configuraciones/tablas",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin"]}
                requiredPermissions={["tabs.config.view", "users.manage"]}
            >
                <ConfiguracionTablas />
            </ProtectedRoute>
        ),
    },
    {/*Administracion*/ },

    {
        path: "/administracion/unificacion-paciente",
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
        element: (
            <ProtectedRoute allowedRoles={["patient"]} requiredModule="patient_portal">
                <Estudios />
            </ProtectedRoute>
        ),
    },
    {
        path: "/mis-datos",
        element: (
            <ProtectedRoute allowedRoles={["patient"]} requiredModule="patient_portal">
                <MisDatos />
            </ProtectedRoute>
        ),
    },
    {/*Nexi IA — deshabilitado temporalmente*/}
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
