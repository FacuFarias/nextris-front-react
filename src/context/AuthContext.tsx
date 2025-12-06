import React, { createContext, useState, useContext, useEffect } from "react";

interface User {
    email: string;
    id: string;
    name: string;
    requires_password_change: boolean;
    role_id: string;
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
    };

    const logout = () => {
        setAuthData(null);
        // Limpiar localStorage
        localStorage.removeItem("authData");
    };

    const updateUser = (user: User) => {
        if (authData) {
            const updatedAuthData = { ...authData, user };
            setAuthData(updatedAuthData);
            localStorage.setItem("authData", JSON.stringify(updatedAuthData));
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