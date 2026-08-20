import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const RootRedirect = () => {
    const { isAuthenticated, authData } = useAuth();
    const userTypes = [authData?.user?.user_type, authData?.user?.role_name]
        .filter(Boolean)
        .map((type) => type!.trim().toLowerCase());
    const isPatient = userTypes.includes("patient");
    const isDoctor = userTypes.some((type) => type === "medico" || type === "médico");
    const home = isPatient
        ? "/estudios"
        : isDoctor
            ? "/estudios/redaccion"
            : "/inicio";
    return isAuthenticated ? <Navigate to={home} replace /> : <Navigate to="/login" replace />;
};
