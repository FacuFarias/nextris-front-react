import { cn } from "@/lib/utils";
import pacientesImg from "@/assets/auth/pacientes.jpg";
import medicoImg from "@/assets/auth/medico.jpg";

interface BackgroundEffectsProps {
    isPatient: boolean;
}

export const BackgroundEffects = ({ isPatient }: BackgroundEffectsProps) => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Background image */}
            <div
                className="absolute inset-0 transition-opacity duration-700 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${isPatient ? pacientesImg : medicoImg})`,
                    opacity: isPatient ? 0.5 : 0.3
                }}
            />

            {/* Main gradient background overlay */}
            <div className={cn(
                "absolute inset-0 transition-all duration-700",
                isPatient
                    ? "bg-linear-to-br from-teal-100/50 via-cyan-100/50 to-emerald-200/60"
                    : "bg-linear-to-br from-purple-950/80 via-violet-950/80 to-purple-900/80"
            )} />

            {/* Floating orbs */}
            <div className={cn(
                "absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl animate-float transition-all duration-700",
                isPatient
                    ? "bg-teal-400/40"
                    : "bg-purple-600/30"
            )} />
            <div className={cn(
                "absolute bottom-20 right-20 w-[500px] h-[500px] rounded-full blur-3xl animate-float transition-all duration-700",
                isPatient
                    ? "bg-cyan-400/40"
                    : "bg-violet-600/30"
            )} style={{ animationDelay: '-3s' }} />
            <div className={cn(
                "absolute top-1/2 left-1/3 w-80 h-80 rounded-full blur-3xl animate-float transition-all duration-700",
                isPatient
                    ? "bg-emerald-400/30"
                    : "bg-violet-600/25"
            )} style={{ animationDelay: '-1.5s' }} />

            {/* Grid pattern */}
            <div className={cn(
                "absolute inset-0 transition-opacity duration-700",
                isPatient ? "opacity-30" : "opacity-20"
            )} style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, ${isPatient ? 'rgb(20 184 166 / 0.3)' : 'rgb(167 139 250 / 0.3)'} 1px, transparent 0)`,
                backgroundSize: '40px 40px'
            }} />

            {/* Medical cross patterns for patient */}
            {isPatient && (
                <>
                    <div className="absolute top-32 right-32 opacity-10">
                        <svg width="60" height="60" viewBox="0 0 60 60" className="text-teal-600">
                            <rect x="24" y="10" width="12" height="40" fill="currentColor" rx="2" />
                            <rect x="10" y="24" width="40" height="12" fill="currentColor" rx="2" />
                        </svg>
                    </div>
                    <div className="absolute bottom-40 left-32 opacity-10">
                        <svg width="40" height="40" viewBox="0 0 60 60" className="text-cyan-600">
                            <rect x="24" y="10" width="12" height="40" fill="currentColor" rx="2" />
                            <rect x="10" y="24" width="40" height="12" fill="currentColor" rx="2" />
                        </svg>
                    </div>
                </>
            )}

            {/* Hex patterns for staff */}
            {!isPatient && (
                <>
                    <div className="absolute top-20 right-40 opacity-10">
                        <svg width="80" height="90" viewBox="0 0 80 90" className="text-purple-400">
                            <polygon points="40,5 75,25 75,65 40,85 5,65 5,25" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                    <div className="absolute bottom-32 left-40 opacity-10">
                        <svg width="60" height="70" viewBox="0 0 80 90" className="text-violet-400">
                            <polygon points="40,5 75,25 75,65 40,85 5,65 5,25" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                </>
            )}
        </div>
    );
};
