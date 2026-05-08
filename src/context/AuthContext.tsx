import React, { createContext, useState, useContext, useEffect } from "react";
import posthog from "posthog-js";

interface User {
    email: string;
    email_verification_required?: boolean;
    email_verified?: boolean;
    facility_id?: string | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authData, setAuthData] = useState<AuthData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedAuthData = localStorage.getItem("authData");
        if (storedAuthData) {
            try {
                setAuthData(JSON.parse(storedAuthData));
            } catch (error) {
                console.error("Error parsing stored auth data:", error);
                localStorage.removeItem("authData");
            }
        }
        setIsLoading(false);
    }, []);

    const login = (data: AuthData) => {
        setAuthData(data);
        // Guardar en localStorage
        localStorage.setItem("authData", JSON.stringify(data));
        // Identify user in PostHog
        try {
            posthog.identify(data.user.id, {
                username: data.user.username,
                name: `${data.user.name} ${data.user.surname}`.trim(),
                email: data.user.email,
                role_id: data.user.role_id,
                user_type: data.user.user_type,
                facility_id: data.user.facility_id ?? null,
            });
            posthog.capture("user_login", { user_type: data.user.user_type });
        } catch {
            // silent — analytics must never break auth
        }
    };

    const logout = () => {
        // Capture before clearing state
        try {
            posthog.capture("user_logout");
            posthog.reset();
        } catch {
            // silent
        }
        setAuthData(null);
        // Limpiar localStorage
        localStorage.removeItem("authData");
        localStorage.removeItem("activeFacilityId");
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