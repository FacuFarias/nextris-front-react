import { Link } from "react-router-dom";
import { ArrowRight, BookPlus, UserRound } from "lucide-react";
import { MainLayout } from "@/layouts/layout";
import { useAuth } from "@/context/AuthContext";
import { useUserModules } from "@/hooks/use-user-modules";

export const PatientInicio = () => {
    const { authData } = useAuth();
    const { moduleCodesSet, disabledModulesSet, isLoading, hasError } = useUserModules(Boolean(authData));
    const enabled = !isLoading && !hasError && moduleCodesSet.has("patient_portal") && !disabledModulesSet.has("patient_portal");
    return (
        <MainLayout>
            <div className="mx-auto max-w-4xl space-y-6 py-3">
                <header className="space-y-2">
                    <p className="text-sm font-medium text-brand-purple dark:text-purple-300">Tu salud, a mano</p>
                    <h1 className="text-2xl font-bold text-foreground [overflow-wrap:anywhere]">Bienvenido, {authData?.user.name || authData?.user.username}</h1>
                    <p className="text-muted-foreground">Consulta tus estudios y mantén tus datos actualizados.</p>
                </header>
                {isLoading ? <p role="status">Cargando accesos…</p> : enabled ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { to: "/estudios", title: "Mis estudios", description: "Consulta tus imágenes, informes y enlaces para compartir.", icon: BookPlus },
                            { to: "/mis-datos", title: "Mis datos", description: "Actualiza tu contacto y gestiona la seguridad de tu cuenta.", icon: UserRound },
                        ].map(({ to, title, description, icon: Icon }) => (
                            <Link key={to} to={to} className="group flex min-w-0 items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm focus-visible:outline-2 focus-visible:outline-brand-purple">
                                <Icon className="h-7 w-7 shrink-0 text-brand-purple dark:text-purple-300" />
                                <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
                                <ArrowRight className="h-5 w-5 shrink-0 self-center text-brand-purple dark:text-purple-300" />
                            </Link>
                        ))}
                    </div>
                ) : <p role="status" className="rounded-xl border border-border bg-card p-4">{hasError ? "No se pudieron cargar los accesos. Vuelve a intentarlo más tarde." : "El portal de pacientes no está disponible para esta cuenta."}</p>}
            </div>
        </MainLayout>
    );
};
