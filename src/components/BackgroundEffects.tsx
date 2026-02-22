import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import pacientesImg from "@/assets/auth/pacientes.jpg";
import medicoImg from "@/assets/auth/medico.jpg";

const PATIENT_COLORS: [number, number, number][] = [
    [13, 148, 136],   // teal-600
    [8, 145, 178],    // cyan-600
    [5, 150, 105],    // emerald-600
];

const STAFF_COLORS: [number, number, number][] = [
    [167, 139, 250],  // violet-400
    [139, 92, 246],   // violet-500
    [216, 180, 254],  // violet-300
];

const ParticleCanvas = ({ isPatient }: { isPatient: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let w = window.innerWidth;
        let h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;

        const onResize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;
        };
        window.addEventListener("resize", onResize);

        type P = {
            x: number; y: number; r: number;
            alpha: number; targetAlpha: number;
            vx: number; vy: number;
            ci: number; life: number; maxLife: number;
        };

        const mkP = (fromBottom = true): P => ({
            x: Math.random() * w,
            y: fromBottom ? h + Math.random() * 50 : Math.random() * h,
            r: Math.random() * 2.8 + 0.6,
            alpha: 0,
            targetAlpha: Math.random() * 0.55 + 0.25,
            vx: (Math.random() - 0.5) * 0.35,
            vy: -(Math.random() * 0.55 + 0.15),
            ci: Math.floor(Math.random() * 3),
            life: 0,
            maxLife: Math.random() * 200 + 80,
        });

        const ps: P[] = Array.from({ length: 65 }, () => mkP(false));
        let raf: number;

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            const palette = isPatient ? PATIENT_COLORS : STAFF_COLORS;

            for (let i = 0; i < ps.length; i++) {
                const p = ps[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life++;

                const fd = 25;
                if (p.life < fd) {
                    p.alpha = Math.min(p.targetAlpha, p.alpha + p.targetAlpha / fd);
                } else if (p.life > p.maxLife - fd) {
                    p.alpha = Math.max(0, p.alpha - p.targetAlpha / fd);
                }

                if (p.life >= p.maxLife) {
                    ps[i] = mkP(true);
                    continue;
                }

                const [r, g, b] = palette[p.ci];
                ctx.shadowBlur = p.r * 6;
                ctx.shadowColor = `rgba(${r},${g},${b},${p.alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            raf = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
        };
    }, [isPatient]);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

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

            {/* Particles */}
            <ParticleCanvas isPatient={isPatient} />

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
