import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const RootRedirect = () => {
    const { isAuthenticated, authData } = useAuth();
    const home = authData?.user?.user_type === "patient" ? "/estudios" : "/inicio";
    return isAuthenticated ? <Navigate to={home} replace /> : <Navigate to="/login" replace />;
};
