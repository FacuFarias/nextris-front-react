import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Login } from "@/modules/auth/login/Login";
import { Inicio } from "@/modules/inicio/Inicio";
import { ProtectedRoute } from "./ProtectedRoute";
import { BuscarPaciente } from "@/modules/pacientes/buscar-paciente/BuscarPaciente";
import { HistorialPaciente } from "@/modules/pacientes/buscar-paciente/pages/historial-paciente/HistorialPaciente";

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
]);

export const AppRoutes = () => {
    return <RouterProvider router={router} />;
};
