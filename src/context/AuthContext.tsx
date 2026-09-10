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
    logout: () => void;
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
                const restored = {
                    ...stored,
                    user: {
                        ...stored.user,
                        permissions: response.data.data.permissions,
                    },
                };
                if (isMounted) setAuthData(restored);
                localStorage.setItem("authData", JSON.stringify(restored));
            } catch {
                try {
                    const stored = JSON.parse(storedAuthData) as AuthData;
                    if (isMounted) setAuthData(stored);
                } catch (parseError) {
                    console.error("Error parsing stored auth data:", parseError);
                    localStorage.removeItem("authData");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void restoreSession();
        return () => { isMounted = false; };
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

    const logout = () => {
        try {
            posthog.capture("user_logout");
            posthog.reset();
        } catch {
            // silent
        }
        setAuthData(null);
        localStorage.removeItem("authData");
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
