import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FirstLoginPasswordModal } from "@/modules/auth/change-password/FirstLoginPasswordModal";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, authData } = useAuth();

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

    const requiresPasswordChange = !!authData?.user?.requires_password_change;

    return (
        <>
            {children}
            <FirstLoginPasswordModal isOpen={requiresPasswordChange} />
        </>
    );
};
