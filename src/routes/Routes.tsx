import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Login } from "@/modules/auth/login/Login";
import { Inicio } from "@/modules/inicio/Inicio";
import { ProtectedRoute } from "./ProtectedRoute";
import { BuscarPaciente } from "@/modules/pacientes/buscar-paciente/BuscarPaciente";
import { HistorialPaciente } from "@/modules/pacientes/buscar-paciente/pages/historial-paciente/HistorialPaciente";
import { AdmisionCita } from "@/modules/admision/admision-cita/AdmisionCita";
import { AdmisionEspontanea } from "@/modules/admision/admision-espontanea/AdmisionEspontanea";
import { NuevaCita } from "@/modules/citas/nueva-cita/NuevaCita";
import { EditarCita } from "@/modules/citas/editar-cita/EditarCita";
import { EditarFecha } from "@/modules/citas/editar-cita/pages/editar-fecha/EditarFecha";
import { Ejecucion } from "@/modules/ejecucion/Ejecucion";
import { Radiologia } from "@/modules/redaccion/Radiologia/Radiologia";
import { InformePredefinidos } from "@/modules/redaccion/informe-predefinidos/InformePredefinidos";

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
        path: "/redaccion/informes-predefinidos",
        element: (
            <ProtectedRoute>
                <InformePredefinidos />
            </ProtectedRoute>
        ),
    },

]);

export const AppRoutes = () => {
    return <RouterProvider router={router} />;
};
