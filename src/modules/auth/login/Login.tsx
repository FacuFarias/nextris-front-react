import { useState } from "react";
import { cn } from "@/lib/utils";
import { LoginCard } from "./components/LoginCard";
import { BackgroundEffects } from "@/components/BackgroundEffects";

interface LoginProps {
    initialIsPatient?: boolean;
}

export const Login = ({ initialIsPatient = false }: LoginProps) => {
    const [isPatient, setIsPatient] = useState(initialIsPatient);

    return (
        <div className={cn(
            "min-h-screen flex items-center justify-center p-4 transition-theme relative",
            !isPatient && "theme-staff"
        )}>
            {/* Background Effects */}
            <BackgroundEffects isPatient={isPatient} />

            {/* Content */}
            <div className="relative z-10 w-full flex flex-col items-center">


                {/* Login Card */}
                <LoginCard
                    isPatient={isPatient}
                    onTypeChange={setIsPatient}
                />

                {/* Bottom info */}
                <div className={cn(
                    "mt-8 text-center animate-slide-up transition-colors duration-500",
                    isPatient ? "text-teal-700/60" : "text-indigo-300/60"
                )} style={{ animationDelay: '0.2s' }}>
                    <p className="text-sm">
                        © 2024 NextRIS - Todos los derechos reservados
                    </p>
                </div>
            </div>
        </div>
    )
}
