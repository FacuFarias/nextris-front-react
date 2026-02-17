import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FirstLoginPasswordModal } from "@/modules/auth/change-password/FirstLoginPasswordModal";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // Si está vacío, todos los usuarios autenticados pueden acceder
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, authData } = useAuth();
    const hasShownErrorRef = useRef(false);

    // Validar roles si se especifican
    const userRole = authData?.user?.user_type;
    const hasAccess = !allowedRoles || allowedRoles.length === 0 || (userRole && allowedRoles.includes(userRole));

    // Mostrar error si no tiene acceso (solo una vez)
    useEffect(() => {
        if (isAuthenticated && !isLoading && !hasAccess && !hasShownErrorRef.current) {
            toast.error("No tienes permisos para acceder a esta página", {
                position: "top-right",
                duration: 3000,
            });
            hasShownErrorRef.current = true;
        }
    }, [isAuthenticated, isLoading, hasAccess]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!hasAccess) {
        return <Navigate to="/inicio" replace />;
    }

    const requiresPasswordChange = !!authData?.user?.requires_password_change;

    return (
        <>
            {children}
            <FirstLoginPasswordModal isOpen={requiresPasswordChange} />
        </>
    );
};
