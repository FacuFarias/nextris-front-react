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
        path: "/inicio",
        element: (
            <ProtectedRoute>
                <Inicio />
            </ProtectedRoute>
        ),
    },
    {/*buscar pacientes*/ },
    {
        path: "/pacientes",
        element: (
            <ProtectedRoute>
                <BuscarPaciente />
            </ProtectedRoute>
        ),
    },
    {
        path: "/pacientes/historial-paciente",
        element: (
            <ProtectedRoute>
                <HistorialPaciente />
            </ProtectedRoute>
        ),
    },

    {/*citas*/ },
    {
        path: "/cita/nueva-cita",
        element: (
            <ProtectedRoute>
                <NuevaCita />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cita/editar-cita",
        element: (
            <ProtectedRoute>
                <EditarCita />
            </ProtectedRoute>
        ),
    },
    {
        path: "/cita/editar-cita/:id",
        element: (
            <ProtectedRoute>
                <EditarFecha />
            </ProtectedRoute>
        ),
    },


    {/*Admision*/ },

    {
        path: "/nueva-admision",
        element: (
            <ProtectedRoute>
                <AdmisionCita />
            </ProtectedRoute>
        ),
    },
    {
        path: "/admision-espontanea",
        element: (
            <ProtectedRoute>
                <AdmisionEspontanea />
            </ProtectedRoute>
        ),
    },
    {/*Ejecucion*/ },
    {
        path: "/ejecucion",
        element: (
            <ProtectedRoute>
                <Ejecucion />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ejecucion/detalle/:guid",
        element: (
            <ProtectedRoute>
                <DetalleEjecucion />
            </ProtectedRoute>
        ),
    },
    {/*Redaccion*/ },
    {
        path: "/redaccion/radiologia",
        element: (
            <ProtectedRoute>
                <Radiologia />
            </ProtectedRoute>
        ),
    },
    {
        path: "/redaccion/radiologia/redactar-informe/:informeGuid/:studyInstanceUID",
        element: (
            <ProtectedRoute>
                <RedactarInforme />
            </ProtectedRoute>
        ),
    },
    {
        path: "/redaccion/informes-predefinidos",
        element: (
            <ProtectedRoute>
                <InformePredefinidos />
            </ProtectedRoute>
        ),
    },
    {
        path: "/redaccion/crear-informe",
        element: (
            <ProtectedRoute>
                <CrearInforme />
            </ProtectedRoute>
        ),
    },

    {/*Distribucion*/ },
    {
        path: "/distribucion",
        element: (
            <ProtectedRoute>
                <Distribucion />
            </ProtectedRoute>
        ),
    },

    {/*Configuraciones*/ },
    {
        path: "/configuraciones/tablas",
        element: (
            <ProtectedRoute>
                <ConfiguracionTablas />
            </ProtectedRoute>
        ),
    },
    {/*Mis estudios pacientes*/ },
    {
        path: "/estudios",
        element: (
            <ProtectedRoute>
                <Estudios />
            </ProtectedRoute>
        ),
    },
    {
        path: "/mis-datos",
        element: (
            <ProtectedRoute>
                <MisDatos />
            </ProtectedRoute>
        ),
    }
]);

export const AppRoutes = () => {
    return <RouterProvider router={router} />;
};
