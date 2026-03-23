import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Login } from "@/modules/auth/login/Login";
import { Inicio } from "@/modules/inicio/Inicio";
import { ProtectedRoute } from "./ProtectedRoute";
import { BuscarPaciente, HistorialPaciente } from "@/modules/pacientes";
import { AdmisionCita, AdmisionEspontanea } from "@/modules/admision";
import { NuevaCita, EditarCita, EditarFecha } from "@/modules/citas";
import { Ejecucion } from "@/modules/ejecucion/Ejecucion";
import { DetalleEjecucion } from "@/modules/ejecucion/detalle-ejecucion/DetalleEjecucion";
import { Radiologia, InformePredefinidos } from "@/modules/redaccion";
import { Distribucion } from "@/modules/distribucion";
import { RedactarInforme } from "@/modules/redaccion/Radiologia/redactar-informe/RedactarInforme";
import { ConfiguracionTablas } from "@/modules/configuracion/configuracion-tablas/ConfiguracionTablas";
import { Estudios } from "@/modules/estudios/Estudios";
import { MisDatos } from "@/modules/mis-datos/MisDatos";
import { CrearInforme } from "@/modules/redaccion/informe-predefinidos/crear-informe/CrearInforme";
import { UnificacionPaciente } from "@/modules/administracion/unificacion-paciente/UnificacionPaciente";
import { ReasignacionExamenes } from "@/modules/administracion/reasignacion-examenes/ReasignacionExamenes";
import { Demograficos } from "@/modules/administracion/demograficos/Demograficos";
import { CargarEstudios } from "@/modules/redaccion/cargar-estudios/CargarEstudios";
import { ChangePassword } from "@/modules/auth/change-password/ChangePassword";
import { ReportesEstructurados } from "@/modules/reportes-estructurados/ReportesEstructurados";
import { Nexi } from "@/modules/nexi/Nexi";

const router = createBrowserRouter([
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
        path: "/inicio",
        element: (
            <ProtectedRoute>
                <Inicio />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cambiar-password",
        element: (
            <ProtectedRoute>
                <ChangePassword />
            </ProtectedRoute>
        ),
    },
    {/*buscar pacientes*/ },
    {
        path: "/buscar-pacientes",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrativo"]}>
                <BuscarPaciente />
            </ProtectedRoute>
        ),
    },
    {
        path: "/buscar-pacientes/historial-paciente",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrativo"]}>
                <HistorialPaciente />
            </ProtectedRoute>
        ),
    },

    {/*citas*/ },
    {
        path: "/cita/nueva-cita",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Administrativo"]} requiredModule="appointments">
                <NuevaCita />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cita/editar-cita",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Administrativo"]} requiredModule="appointments">
                <EditarCita />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cita/editar-cita/:id",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Administrativo"]} requiredModule="appointments">
                <EditarFecha />
            </ProtectedRoute>
        ),
    },


    {/*Admision*/ },

    {
        path: "/nueva-admision",
        element: (
            <ProtectedRoute
                allowedRoles={["Sysadmin", "Administrativo"]}
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
                allowedRoles={["Sysadmin", "Administrativo"]}
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
            <ProtectedRoute allowedRoles={["Sysadmin", "Tecnico"]}>
                <Ejecucion />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ejecucion/detalle/:guid",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Tecnico"]}>
                <DetalleEjecucion />
            </ProtectedRoute>
        ),
    },
    {/*Redaccion*/ },
    {
        path: "/estudios/redaccion",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico"]}>
                <Radiologia />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/redaccion/redactar-informe/:informeGuid/:studyInstanceUID",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico"]}>
                <RedactarInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/informes-predefinidos",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico"]}>
                <InformePredefinidos />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/crear-informe",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico"]}>
                <CrearInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/editar-informe/:id",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico"]}>
                <CrearInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/estudios/cargar-estudios",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico"]}>
                <CargarEstudios />
            </ProtectedRoute>
        ),
    },

    {/*Distribucion*/ },
    {
        path: "/distribucion",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Administrativo"]}>
                <Distribucion />
            </ProtectedRoute>
        ),
    },

    {/*Configuraciones*/ },
    {
        path: "/configuraciones/tablas",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin"]}>
                <ConfiguracionTablas />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reportes-estructurados/lista-parser",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin"]} requiredModule="structured_reports">
                <ReportesEstructurados />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reportes-estructurados/mapeo-variables",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin"]} requiredModule="structured_reports">
                <ReportesEstructurados />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reportes-estructurados/conceptos-criterios",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin"]} requiredModule="structured_reports">
                <ReportesEstructurados />
            </ProtectedRoute>
        ),
    },
    {
        path: "/reportes-estructurados/plantillas-inteligentes",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin"]} requiredModule="structured_reports">
                <ReportesEstructurados />
            </ProtectedRoute>
        ),
    },
    {/*Administracion*/ },

    {
        path: "/administracion/unificacion-paciente",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin"]}>
                <UnificacionPaciente />
            </ProtectedRoute>
        ),
    },
    {
        path: "/administracion/reasignacion-examenes",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin"]}>
                <ReasignacionExamenes />
            </ProtectedRoute>
        ),
    },
    {
        path: "/administracion/demograficos",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin"]}>
                <Demograficos />
            </ProtectedRoute>
        ),
    },
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
    {/*Nexi IA*/},
    {
        path: "/nexi",
        element: (
            <ProtectedRoute allowedRoles={["Sysadmin", "Medico", "Tecnico", "Administrativo"]} requiredModule="nexi">
                <Nexi />
            </ProtectedRoute>
        ),
    }
]);

export const AppRoutes = () => {
    return <RouterProvider router={router} />;
};
