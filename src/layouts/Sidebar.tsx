import { useState, useMemo } from "react";
import {
    Users,
    Settings,
    Power,
    ChevronDown,
    ChevronRight,
    UserCog,
    ClipboardList,
    NotebookText,
    Navigation,
    BookPlus,
    User,
    UploadCloud,
    Home,
    Briefcase,
    Sun,
    Moon,
    Monitor,
    Image,
    Info,
    PanelLeftClose,
    PanelLeftOpen,
    Share2,
    Waypoints,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo/logo5.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserModules } from "@/hooks/use-user-modules";
import { Modal } from "@/components/Modal";
import { toast } from "sonner";

interface MenuItem {
    icon: React.ElementType;
    label: string;
    path?: string;
    subItems?: { icon: React.ElementType; label: string; path: string; allowedRoles?: string[]; requiredPermissions?: string[]; requiredModule?: string }[];
    allowedRoles?: string[];
    requiredPermissions?: string[];
    requiredModule?: string;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const menuItems: MenuItem[] = [
    {
        icon: Home,
        label: "Inicio",
        path: "/inicio",
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"],
        requiredPermissions: [
            "tabs.patients.view",
            "tabs.appointments.view",
            "tabs.admissions.view",
            "tabs.worklist.view",
            "tabs.distribution.view",
            "tabs.config.view",
            "tabs.gestion.view",
            // "tabs.structured_reports.view", — deshabilitado temporalmente
            // "tabs.nexi.view", — deshabilitado temporalmente
            "tabs.images.view",
        ],
    },
    {
        icon: Users,
        label: "Pacientes",
        path: "/buscar-pacientes",
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"],
        requiredPermissions: ["tabs.patients.view", "patients.view"],
    },
    {
        icon: Image,
        label: "Imágenes",
        path: "/imagenes",
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrador"],
        requiredPermissions: ["tabs.images.view", "images.view"],
    },
    {
        icon: NotebookText,
        label: "Lista de trabajo",
        path: "/worklist",
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrador"],
        requiredPermissions: ["tabs.worklist.view"],
    },
    {
        icon: NotebookText,
        label: "Vista administrativa",
        path: "/administrative_view",
        allowedRoles: ["Sysadmin", "Administrador", "Administrativo"],
        requiredPermissions: ["tabs.worklist.view"],
    },
    {
        icon: Navigation,
        label: "Distribucion",
        path: "/distribucion",
        allowedRoles: ["Sysadmin", "Administrativo", "Administrador", "Medico"],
        requiredPermissions: ["tabs.distribution.view", "distribution.view"],
    },
    {
        icon: Briefcase,
        label: "Gestión",
        path: "/administracion",
        requiredPermissions: ["tabs.gestion.view"],
        subItems: [
            {
                icon: UserCog,
                label: "Unificación de Paciente",
                path: "/administracion/unificacion-paciente",
                allowedRoles: ["Sysadmin", "Administrador"],
                requiredPermissions: ["tabs.gestion.view"],
            },
            {
                icon: ClipboardList,
                label: "Reasignación de Exámenes",
                path: "/administracion/reasignacion-examenes",
                allowedRoles: ["Sysadmin", "Administrador"],
                requiredPermissions: ["tabs.gestion.view"],
            },
            {
                icon: NotebookText,
                label: "Informes predefinidos",
                path: "/gestion/informes-predefinidos",
                allowedRoles: ["Sysadmin", "Medico", "Administrador"],
                requiredPermissions: ["templates.manage"],
            },
            {
                icon: UploadCloud,
                label: "Cargar estudios",
                path: "/gestion/cargar-estudios",
                allowedRoles: ["Sysadmin", "Medico", "Administrador"],
                requiredPermissions: ["dicom.studies.manage"],
            },
            {
                icon: Share2,
                label: "Accesos externos compartidos",
                path: "/gestion/accesos-externos",
                allowedRoles: ["Sysadmin", "Administrador"],
                requiredPermissions: ["tabs.gestion.view"],
            },
            {
                icon: Waypoints,
                label: "Integración Clínica Parque",
                path: "/gestion/integracion-clinica-parque",
                allowedRoles: ["Sysadmin", "Administrador"],
                requiredPermissions: ["tabs.gestion.view"],
            },
            // DEPRECATED
            // {
            //     icon: Users,
            //     label: "Demográficos",
            //     path: "/administracion/demograficos",
            //     allowedRoles: ["Sysadmin", "Administrador"],
            //     requiredPermissions: ["tabs.gestion.view"],
            // },
        ]
    },
    {
        icon: Settings,
        label: "Configuraciones",
        path: "/configuraciones/tablas",
        allowedRoles: ["Sysadmin", "Admin", "Administrador"],
        requiredPermissions: ["users.manage", "users.impersonate"],
    },
    // structured_reports — deshabilitado temporalmente
    // {
    //     icon: FileCode2,
    //     label: "Reportes estructurados",
    //     allowedRoles: ["Sysadmin"],
    //     requiredPermissions: ["tabs.structured_reports.view"],
    //     requiredModule: "structured_reports",
    //     subItems: [
    //         {
    //             icon: FileCode2,
    //             label: "Lista de parser",
    //             path: "/reportes-estructurados/lista-parser",
    //             requiredPermissions: ["tabs.structured_reports.view"],
    //             requiredModule: "structured_reports",
    //         },
    //         {
    //             icon: ListTree,
    //             label: "Mapeo de variables",
    //             path: "/reportes-estructurados/mapeo-variables",
    //             requiredPermissions: ["tabs.structured_reports.view"],
    //             requiredModule: "structured_reports",
    //         },
    //         {
    //             icon: Scale,
    //             label: "Conceptos y criterios",
    //             path: "/reportes-estructurados/conceptos-criterios",
    //             requiredPermissions: ["tabs.structured_reports.view"],
    //             requiredModule: "structured_reports",
    //         },
    //         {
    //             icon: Files,
    //             label: "Plantillas inteligentes",
    //             path: "/reportes-estructurados/plantillas-inteligentes",
    //             requiredPermissions: ["tabs.structured_reports.view"],
    //             requiredModule: "structured_reports",
    //         },
    //     ],
    // },
    // nexi — deshabilitado temporalmente
    // {
    //     icon: Sparkles,
    //     label: "Nexi",
    //     path: "/nexi",
    //     allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"],
    //     requiredPermissions: ["tabs.nexi.view"],
    //     requiredModule: "nexi",
    // },
    {
        icon: BookPlus,
        label: "Mis Estudios",
        path: "/estudios",
        allowedRoles: ["patient"],
        requiredModule: "patient_portal",
    },
    {
        icon: User,
        label: "Mis datos",
        path: "/mis-datos",
        allowedRoles: ["patient"],
        requiredModule: "patient_portal",
    },
];

export const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) => {

    const { authData, logout } = useAuth();
    const { moduleCodesSet, isLoading: isModulesLoading, hasError: hasModulesError } = useUserModules(Boolean(authData));
    const { theme, setTheme, actualTheme } = useTheme();
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const themeIcon = theme === 'light'
        ? <Sun className="w-4 h-4" />
        : theme === 'dark'
            ? <Moon className="w-4 h-4" />
            : <Monitor className="w-4 h-4" />;

    const themeLabel = theme === 'light' ? 'Modo claro' : theme === 'dark' ? 'Modo oscuro' : 'Modo sistema';
    const navigate = useNavigate();
    const location = useLocation();

    const userRole = authData?.user?.user_type || "";
    const userPermissions = Array.isArray((authData?.user as any)?.permissions)
        ? ((authData?.user as any)?.permissions as string[])
        : [];

    const hasAccess = (allowedRoles?: string[], requiredPermissions?: string[]) => {
        const hasRoleConstraint = Array.isArray(allowedRoles) && allowedRoles.length > 0;
        const hasPermissionConstraint = Array.isArray(requiredPermissions) && requiredPermissions.length > 0;
        const isStaffUser = userRole !== "patient";

        const roleAccess = hasRoleConstraint ? allowedRoles!.includes(userRole) : true;
        const permissionAccess = isStaffUser
            ? (
                hasPermissionConstraint
                    ? (userPermissions.includes("*") || requiredPermissions!.some((permission) => userPermissions.includes(permission)))
                    : false
            )
            : (
                hasPermissionConstraint
                    ? (userPermissions.includes("*") || requiredPermissions!.some((permission) => userPermissions.includes(permission)))
                    : true
            );

        return roleAccess && permissionAccess;
    };

    const hasModuleAccess = (requiredModule?: string) => {
        if (!requiredModule) {
            return true;
        }

        // Si no se pudo cargar el scope de módulos, se deniega por seguridad.
        if (isModulesLoading || hasModulesError) {
            return false;
        }

        return moduleCodesSet.has(requiredModule);
    };

    const filteredMenuItems = useMemo(() =>
        menuItems.map(item => {
            if (!hasAccess(item.allowedRoles, item.requiredPermissions)) return null;
            if (!hasModuleAccess(item.requiredModule)) return null;

            if (item.subItems) {
                const filteredSubItems = item.subItems.filter(subItem => {
                    if (!hasAccess(subItem.allowedRoles, subItem.requiredPermissions)) return false;
                    if (!hasModuleAccess(subItem.requiredModule)) return false;
                    return true;
                });
                if (filteredSubItems.length === 0) return null;
                return { ...item, subItems: filteredSubItems };
            }

            return item;
        }).filter(Boolean) as MenuItem[]
        , [userRole, userPermissions, isModulesLoading, hasModulesError, moduleCodesSet]);

    // Inicializar ya con los items que corresponden a la ruta actual abiertos
    const [expandedItems, setExpandedItems] = useState<string[]>(() =>
        menuItems
            .filter(item =>
                item.subItems?.some(subItem => location.pathname === subItem.path)
            )
            .map(item => item.label)
    );

    const toggleItem = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-40 h-dvh w-[min(20rem,88vw)] border-border pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-[width,transform] duration-300 ease-in-out lg:py-0",
                collapsed ? "lg:w-16" : "lg:w-52",
                "lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
                style={{
                    background: actualTheme === 'dark'
                        ? '#2D1B4E'
                        : 'linear-gradient(to bottom, #2D1B4E 0%, #2D1B4E 40%, #1a0f2e 100%)'
                }}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className={cn(
                        "h-14 flex items-center border-b border-purple-800/30 px-3",
                        collapsed && "lg:justify-center lg:px-2"
                    )}>
                        <div className={cn(
                            "flex items-center cursor-pointer",
                            collapsed ? "lg:justify-center" : "flex-1"
                        )} onClick={() => navigate(userRole === "patient" ? "/estudios" : "/inicio")}>
                            <img src={logo} alt="NextRIS Logo" className="w-6 h-6 brightness-105" />
                            <span className={cn("ml-2 font-display text-base font-bold text-white", collapsed && "lg:hidden")}>
                                Next<span className="text-purple-400">RIS</span>
                            </span>
                        </div>
                        <button
                            onClick={cycleTheme}
                            className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-lg text-white transition-colors hover:bg-purple-700/50 lg:h-auto lg:w-auto lg:p-1.5",
                                collapsed && "lg:hidden"
                            )}
                            title={themeLabel}
                        >
                            {themeIcon}
                        </button>
                        <button
                            onClick={onToggleCollapse}
                            className="hidden h-11 w-11 items-center justify-center rounded-lg text-white transition-colors hover:bg-purple-700/50 lg:flex lg:h-auto lg:w-auto lg:p-1.5"
                            title={collapsed ? "Expandir menú" : "Colapsar menú"}
                            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                        >
                            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 overflow-y-auto py-2">
                        <ul className="space-y-0.5 px-2">
                            {filteredMenuItems.map((item) => (
                                <li key={item.label}>
                                    {item.subItems ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (collapsed) {
                                                        onToggleCollapse();
                                                        setExpandedItems((prev) => prev.includes(item.label) ? prev : [...prev, item.label]);
                                                        return;
                                                    }
                                                    toggleItem(item.label);
                                                }}
                                                title={collapsed ? item.label : undefined}
                                                aria-label={collapsed ? item.label : undefined}
                                                className={cn(
                                                    "group flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-white transition-all duration-300 hover:bg-purple-700 lg:min-h-0",
                                                    collapsed && "lg:justify-center"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <item.icon className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
                                                    <span className={cn("text-xs font-medium", collapsed && "lg:hidden")}>{item.label}</span>
                                                </div>
                                                {!collapsed && (expandedItems.includes(item.label) ? (
                                                    <ChevronDown className="w-3 h-3 transition-transform duration-300" />
                                                ) : (
                                                    <ChevronRight className="w-3 h-3 transition-transform duration-300" />
                                                ))}
                                            </button>
                                            <div className={cn(
                                                "overflow-hidden transition-all duration-300 ease-in-out",
                                                expandedItems.includes(item.label)
                                                    ? (collapsed
                                                        ? "max-h-96 opacity-100 lg:max-h-0 lg:opacity-0"
                                                        : "max-h-96 opacity-100")
                                                    : "max-h-0 opacity-0"
                                            )}>
                                                <ul className="mt-0.5 ml-2 space-y-0.5 pb-0.5">
                                                    {item.subItems.map((subItem) => (
                                                        <li key={subItem.path}>
                                                            <Link
                                                                to={subItem.path || "#"}
                                                                onClick={() => {
                                                                    if (window.innerWidth < 1024) {
                                                                        onClose();
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "group flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-white transition-all duration-300 lg:min-h-0",
                                                                    location.pathname === subItem.path
                                                                        ? "bg-purple-700"
                                                                        : "hover:bg-purple-700"
                                                                )}
                                                            >
                                                                <subItem.icon className={cn(
                                                                    "w-3 h-3 transition-transform duration-300",
                                                                    location.pathname === subItem.path ? "text-white" : "group-hover:text-white group-hover:scale-110"
                                                                )} />
                                                                <span className={cn("text-xs", collapsed && "lg:hidden")}>{subItem.label}</span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    ) : (
                                        <Link
                                            to={item.path || "#"}
                                            onClick={() => {
                                                if (window.innerWidth < 1024) {
                                                    onClose();
                                                }
                                            }}
                                            title={collapsed ? item.label : undefined}
                                            aria-label={collapsed ? item.label : undefined}
                                            className={cn(
                                                "group flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-white transition-all duration-300 lg:min-h-0",
                                                collapsed && "lg:justify-center",
                                                location.pathname === item.path
                                                    ? "bg-purple-700"
                                                    : "hover:bg-purple-700"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "w-4 h-4 transition-transform duration-300 text-white group-hover:scale-110"
                                            )} />
                                            <span className={cn("text-xs font-medium", collapsed && "lg:hidden")}>{item.label}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Section */}
                    <div className="p-2 border-t border-purple-800/30">
                        <div className={cn(
                            "flex items-center gap-2 p-2 rounded-lg bg-purple-800/30",
                            collapsed && "lg:justify-center"
                        )} title={collapsed ? authData?.user.username : undefined}>
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">{authData?.user.username.charAt(0).toUpperCase()}{authData?.user.username.charAt(1).toUpperCase()}</span>
                            </div>
                            <div className={cn("flex-1 min-w-0", collapsed && "lg:hidden")}>
                                <p className="text-xs font-medium text-white truncate">{authData?.user.impersonation?.actor_username || authData?.user.username}</p>
                                {authData?.user.impersonation && (
                                    <p className="text-[10px] text-amber-200 truncate" title={`Conectado como ${authData.user.username}`}>
                                        Conectado como {authData.user.username}
                                    </p>
                                )}
                                <p className="text-[10px] text-purple-300">{authData?.user?.user_type}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsAboutModalOpen(true)}
                            title={collapsed ? "Acerca de NextRIS" : undefined}
                            aria-label={collapsed ? "Acerca de NextRIS" : undefined}
                            className={cn(
                                "group mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-purple-300 transition-all duration-300 hover:bg-purple-700 lg:min-h-0",
                                collapsed && "lg:justify-center"
                            )}
                        >
                            <Info className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                            <span className={cn(collapsed && "lg:hidden")}>Acerca de NextRIS</span>
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    await logout();
                                    navigate('/');
                                } catch {
                                    toast.error('No se pudo cerrar la sesión. Inténtalo nuevamente.');
                                }
                            }}
                            title={collapsed ? "Desconectarse" : undefined}
                            aria-label={collapsed ? "Desconectarse" : undefined}
                            className={cn(
                                "group mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-400 transition-all duration-300 hover:bg-red-900/30 lg:min-h-0",
                                collapsed && "lg:justify-center"
                            )}
                        >
                            <Power className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                            <span className={cn(collapsed && "lg:hidden")}>Desconectarse</span>
                        </button>
                    </div>
                </div>
            </aside>

            <Modal
                isOpen={isAboutModalOpen}
                onClose={() => setIsAboutModalOpen(false)}
                title="Acerca de NextRIS"
                size="md"
                className="border-purple-100/80 shadow-2xl dark:border-purple-900/60"
            >
                <div className="space-y-5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 p-4 dark:border-purple-900/60 dark:from-purple-950/50 dark:via-background dark:to-fuchsia-950/30">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-purple-100 dark:ring-purple-900/50">
                            <img src={logo} alt="Logo de NextRIS" className="h-full w-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <a
                                href="https://softinhealth.com/es/productos/nextris/"
                                target="_blank"
                                rel="noreferrer"
                                className="font-display text-lg font-bold tracking-tight text-foreground transition-colors hover:text-brand-purple"
                            >
                                Next<span className="text-brand-purple">RIS</span>
                            </a>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-brand-purple/75 dark:text-purple-300">
                                Radiology Information System
                            </p>
                        </div>
                    </div>

                    <p className="leading-6">
                        <strong className="font-semibold text-foreground">NextRIS</strong> es un sistema de información radiológica
                        desarrollado por{" "}
                        <a
                            href="https://softinhealth.com/es/"
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-foreground underline decoration-brand-purple/40 underline-offset-2 transition-colors hover:text-brand-purple hover:decoration-brand-purple"
                        >
                            Soft in Health
                        </a>.
                    </p>

                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border/80 bg-muted/20 dark:bg-muted/10">
                        <div className="flex items-center justify-between gap-4 px-4 py-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Líder del proyecto</span>
                            <span className="text-right font-medium text-foreground">Facundo Farias</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 px-4 py-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Especialidad</span>
                            <span className="text-right font-medium text-foreground">Informática médica</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground">
                        <span>Gestión radiológica conectada</span>
                        <span className="font-medium text-brand-purple dark:text-purple-300">NextRIS</span>
                    </div>
                </div>
            </Modal>
        </>
    );
};
