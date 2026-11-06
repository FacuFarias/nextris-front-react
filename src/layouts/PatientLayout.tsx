import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BookPlus, Home, LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserModules } from "@/hooks/use-user-modules";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import clinicaLogo from "@/assets/logo/logo5.png";
import { Sidebar } from "./Sidebar";

export const PatientLayout = ({ children }: { children: ReactNode }) => {
    const { authData, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { moduleCodesSet, disabledModulesSet, isLoading, hasError } = useUserModules(Boolean(authData));
    const [collapsed, setCollapsed] = useState(true);
    const [viewportHeight, setViewportHeight] = useState(() => window.visualViewport?.height);
    useEffect(() => {
        const viewport = window.visualViewport;
        const resize = () => setViewportHeight(viewport?.height);
        viewport?.addEventListener("resize", resize);
        return () => viewport?.removeEventListener("resize", resize);
    }, []);
    const navigate = useNavigate();
    const portalEnabled = !isLoading && !hasError && moduleCodesSet.has("patient_portal") && !disabledModulesSet.has("patient_portal");
    const links = [
        { to: "/inicio", label: "Inicio", icon: Home },
        ...(portalEnabled ? [
            { to: "/estudios", label: "Mis estudios", icon: BookPlus },
            { to: "/mis-datos", label: "Mis datos", icon: UserRound },
        ] : []),
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/pacientes", { replace: true });
        } catch {
            toast.error("No se pudo cerrar la sesión. Inténtalo nuevamente.");
        }
    };

    return (
        <div style={{ height: viewportHeight }} className="patient-portal flex h-dvh min-w-0 flex-col overflow-hidden bg-background">
            <header className="z-40 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)] lg:hidden">
                <div className="flex min-h-16 min-w-0 items-center gap-3">
                    <img src={clinicaLogo} alt="NextRIS" className="h-12 w-20 shrink-0 object-contain" />
                    <p className="text-sm font-semibold text-foreground">Portal de pacientes</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button aria-label="Opciones de cuenta" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-brand-purple focus-visible:outline-2 focus-visible:outline-brand-purple dark:text-purple-300">
                            <UserRound className="h-5 w-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="patient-account w-64 max-w-[calc(100vw-2rem)]">
                        <DropdownMenuLabel className="break-words [overflow-wrap:anywhere]">{authData?.user.username}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {([['light', 'Claro', Sun], ['dark', 'Oscuro', Moon], ['system', 'Sistema', Monitor]] as const).map(([value, label, Icon]) => (
                            <DropdownMenuItem key={value} onSelect={() => setTheme(value)} className="min-h-11">
                                <Icon className="h-4 w-4" />{label}{theme === value && <span className="ml-auto text-xs">Activo</span>}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => { void handleLogout(); }} className="min-h-11">
                            <LogOut className="h-4 w-4" />Cerrar sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <div className="hidden lg:block">
                <Sidebar isOpen={false} onClose={() => {}} collapsed={collapsed} onToggleCollapse={() => setCollapsed(value => !value)} />
            </div>
            <main id="patient-content" className={`min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain ${collapsed ? "lg:ml-16" : "lg:ml-52"}`}>
                {authData?.user.impersonation && (
                    <div className="border-b border-amber-300 bg-amber-100 p-3 text-sm text-amber-950 [overflow-wrap:anywhere]">
                        {authData.user.impersonation.actor_username} conectado como {authData.user.username}
                    </div>
                )}
                <div className="min-w-0 p-3 pb-6 sm:p-5">{children}</div>
            </main>
            <nav aria-label="Navegación del paciente" className="z-40 flex shrink-0 border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-medium ${isActive ? "bg-purple-50 text-brand-purple dark:bg-purple-950 dark:text-purple-200" : "text-muted-foreground"}`}>
                        <Icon aria-hidden="true" className="h-5 w-5" />{label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};
