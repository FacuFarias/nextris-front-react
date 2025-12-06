import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const RootRedirect = () => {
    const { isAuthenticated } = useAuth();

    return isAuthenticated ? <Navigate to="/inicio" replace /> : <Navigate to="/login" replace />;
};
