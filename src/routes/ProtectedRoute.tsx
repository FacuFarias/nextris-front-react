import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FirstLoginPasswordModal } from "@/modules/auth/change-password/FirstLoginPasswordModal";
import { EmailVerificationModal } from "@/modules/auth/email-verification/EmailVerificationModal";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUserModules } from "@/hooks/use-user-modules";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // Si está vacío, todos los usuarios autenticados pueden acceder
    requiredPermissions?: string[];
    requiredModule?: string;
    allowWithoutPermissions?: boolean;
}

export const ProtectedRoute = ({ children, allowedRoles, requiredPermissions, requiredModule, allowWithoutPermissions = false }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, authData } = useAuth();
    const { moduleCodesSet, isLoading: isModulesLoading, hasError: hasModulesError } = useUserModules(isAuthenticated);
    const hasShownErrorRef = useRef(false);

    const userRole = authData?.user?.user_type;
    const userPermissions = Array.isArray((authData?.user as any)?.permissions)
        ? ((authData?.user as any)?.permissions as string[])
        : [];

    const hasRoleConstraint = Array.isArray(allowedRoles) && allowedRoles.length > 0;
    const hasPermissionConstraint = Array.isArray(requiredPermissions) && requiredPermissions.length > 0;
    const isStaffUser = userRole !== 'patient';

    const hasRoleAccess = hasRoleConstraint ? Boolean(userRole && allowedRoles?.includes(userRole)) : true;
    const hasPermissionAccess = hasPermissionConstraint
        ? (userPermissions.includes("*") || requiredPermissions!.some((permission) => userPermissions.includes(permission)))
        : (isStaffUser ? allowWithoutPermissions : true);

    const hasAccess = hasRoleAccess && hasPermissionAccess;

    const hasModuleAccess = !requiredModule
        ? true
        : (!hasModulesError && moduleCodesSet.has(requiredModule));

    // Mostrar error si no tiene acceso (solo una vez)
    useEffect(() => {
        if (isAuthenticated && !isLoading && !isModulesLoading && !hasShownErrorRef.current && (!hasAccess || !hasModuleAccess)) {
            toast.error(!hasModuleAccess
                ? "Tu institución no tiene este módulo habilitado"
                : "No tienes permisos para acceder a esta página", {
                position: "top-right",
                duration: 3000,
            });
            hasShownErrorRef.current = true;
        }
    }, [isAuthenticated, isLoading, isModulesLoading, hasAccess, hasModuleAccess]);

    if (isLoading || (requiredModule && isModulesLoading && !hasModulesError)) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!hasAccess || !hasModuleAccess) {
        return <Navigate to="/inicio" replace />;
    }

    const requiresPasswordChange = !!authData?.user?.requires_password_change;
    const requiresEmailVerification = !!authData?.user?.email_verification_required;

    if (requiresEmailVerification) {
        return <EmailVerificationModal />;
    }

    return (
        <>
            {children}
            <FirstLoginPasswordModal isOpen={requiresPasswordChange} />
        </>
    );
};
