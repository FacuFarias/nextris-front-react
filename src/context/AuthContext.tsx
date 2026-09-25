import React, { createContext, useState, useContext, useEffect } from "react";
import posthog from "posthog-js";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

interface User {
    email: string;
    id: string;
    location_id?: string | null;
    name: string;
    permissions?: string[];
    requires_password_change: boolean;
    role_id: string;
    role_name?: string;
    surname: string;
    user_type: string;
    username: string;
    impersonation?: {
        actor_id: string;
        actor_username: string;
        session_id: string;
    };
}

interface AuthData {
    access_token: string;
    refresh_token: string;
    user: User;
}

interface AuthContextType {
    authData: AuthData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: AuthData) => void;
    replaceSession: (data: AuthData) => void;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    markPasswordChanged: () => void;
    refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authData, setAuthData] = useState<AuthData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const storedAuthData = localStorage.getItem("authData");
        if (!storedAuthData) {
            setIsLoading(false);
            return () => { isMounted = false; };
        }

        const restoreSession = async () => {
            try {
                const stored = JSON.parse(storedAuthData) as AuthData;
                const response = await api.post<{ success: boolean; data: { permissions: string[] } }>(
                    "/auth/refresh-permissions"
                );
                const latestSession = JSON.parse(localStorage.getItem("authData") || "null") as AuthData | null;
                const restored = {
                    ...(latestSession || stored),
                    user: {
                        ...(latestSession || stored).user,
                        permissions: response.data.data.permissions,
                    },
                };
                if (isMounted) setAuthData(restored);
                localStorage.setItem("authData", JSON.stringify(restored));
            } catch (error) {
                console.error("[AuthContext] No se pudo restaurar la sesión:", error);
                localStorage.removeItem("authData");
                localStorage.setItem("nextris_session_switch", crypto.randomUUID());
                if (isMounted) setAuthData(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void restoreSession();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        const synchronizeSession = (event: StorageEvent) => {
            if (event.key !== "nextris_session_switch") return;
            queryClient.clear();
            window.location.replace(localStorage.getItem("authData") ? "/inicio" : "/login");
        };
        const expireSession = () => {
            setAuthData(null);
            queryClient.clear();
            localStorage.setItem("nextris_session_switch", crypto.randomUUID());
            window.location.replace("/login");
        };
        window.addEventListener("storage", synchronizeSession);
        window.addEventListener("nextris-auth-expired", expireSession);
        return () => {
            window.removeEventListener("storage", synchronizeSession);
            window.removeEventListener("nextris-auth-expired", expireSession);
        };
    }, []);

    const login = (data: AuthData) => {
        setAuthData(data);
        localStorage.setItem("authData", JSON.stringify(data));
        try {
            posthog.identify(data.user.id, {
                username: data.user.username,
                name: `${data.user.name} ${data.user.surname}`.trim(),
                email: data.user.email,
                role_id: data.user.role_id,
                user_type: data.user.user_type,
            });
            posthog.capture("user_login", { user_type: data.user.user_type });
        } catch {
            // silent
        }
    };

    const replaceSession = (data: AuthData) => {
        queryClient.clear();
        localStorage.removeItem("activeFacilityId");
        sessionStorage.removeItem("nextris_session_id");
        try {
            posthog.reset();
        } catch {
            // silent
        }
        login(data);
        localStorage.setItem("nextris_session_switch", crypto.randomUUID());
    };

    const logout = async () => {
        if (authData?.user.impersonation) {
            try {
                await api.post("/auth/logout");
            } catch (error) {
                console.error("[AuthContext] No se pudo cerrar la sesión asumida:", error);
                const status = (error as { response?: { status?: number } }).response?.status;
                if (status !== 401 && status !== 422) throw error;
            }
        }
        try {
            posthog.capture("user_logout");
            posthog.reset();
        } catch {
            // silent
        }
        setAuthData(null);
        localStorage.removeItem("authData");
        localStorage.setItem("nextris_session_switch", crypto.randomUUID());
        localStorage.removeItem("activeFacilityId");
        queryClient.clear();
    };

    const updateUser = (user: User) => {
        if (authData) {
            const updatedAuthData = { ...authData, user };
            setAuthData(updatedAuthData);
            localStorage.setItem("authData", JSON.stringify(updatedAuthData));
        }
    };

    const markPasswordChanged = () => {
        if (!authData) {
            return;
        }

        const updatedAuthData = {
            ...authData,
            user: {
                ...authData.user,
                requires_password_change: false,
            },
        };

        setAuthData(updatedAuthData);
        localStorage.setItem("authData", JSON.stringify(updatedAuthData));
    };

    const refreshPermissions = async () => {
        if (!authData) {
            return;
        }

        try {
            const response = await api.post<{ success: boolean; data: { permissions: string[] } }>(
                "/auth/refresh-permissions"
            );
            const newPermissions = response.data.data.permissions;
            const updatedAuthData = {
                ...authData,
                user: {
                    ...authData.user,
                    permissions: newPermissions,
                },
            };
            setAuthData(updatedAuthData);
            localStorage.setItem("authData", JSON.stringify(updatedAuthData));
        } catch (error) {
            console.error("[AuthContext] Error refreshing permissions:", error);
            throw error;
        }
    };



    const isAuthenticated = !!authData;

    return (
        <AuthContext.Provider
            value={{
                authData,
                isAuthenticated,
                isLoading,
                login,
                replaceSession,
                logout,
                updateUser,
                markPasswordChanged,
                refreshPermissions,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
