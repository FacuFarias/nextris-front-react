import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Login } from "@/modules/auth/login/Login";
import { Inicio } from "@/modules/inicio/Inicio";
import { BuscarPaciente } from "@/modules/pacientes/buscar-paciente/BuscarPaciente";

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
        element: <Inicio />,
    },
    {/*buscar pacientes*/ },
    {
        path: "/pacientes/buscar-paciente",
        element: <BuscarPaciente />,
    },
]);

export const AppRoutes = () => {
    return <RouterProvider router={router} />;
};
