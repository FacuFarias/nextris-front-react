import { useAuth } from "@/context/AuthContext";

interface IsAdminProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const IsAdmin = ({ children, fallback = null }: IsAdminProps) => {
    const { authData } = useAuth();

    // Verifica si el usuario es admin
    const isAdmin = authData?.user?.name === "Administrador";

    if (isAdmin) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
