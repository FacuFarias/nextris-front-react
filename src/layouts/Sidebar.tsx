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
    PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo/logo5.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserModules } from "@/hooks/use-user-modules";
import { Modal } from "@/components/Modal";

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
            "tabs.execution.view",
            "tabs.reports.view",
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
        path: "/estudios/imagenes",
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrador"],
        requiredPermissions: ["tabs.images.view", "images.view"],
    },
    {
        icon: PlayCircle,
        label: "Ejecución",
        path: "/ejecucion",
        allowedRoles: ["Sysadmin", "Tecnico", "Administrador"],
        requiredPermissions: ["tabs.execution.view", "execution.view_pending"],
    },
    {
        icon: NotebookText, label: "Estudios", subItems: [
            {
                icon: NotebookText,
                label: "Redaccion",
                path: "/estudios/redaccion",
                requiredPermissions: ["tabs.reports.view", "reports.view_writing"],
            },
            {
                icon: NotebookText,
                label: "Inf.Predef",
                path: "/estudios/informes-predefinidos",
                requiredPermissions: ["tabs.reports.view", "reports.view_reports"],
            },
            {
                icon: UploadCloud,
                label: "Cargar Estudios",
                path: "/estudios/cargar-estudios",
                requiredPermissions: ["tabs.reports.view", "reports.view_writing"],
            }
        ],
        allowedRoles: ["Sysadmin", "Medico", "Administrador", "Administrativo"],
        requiredPermissions: ["tabs.reports.view", "reports.view_writing", "reports.view_reports"],
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
        allowedRoles: ["Sysadmin"],
        requiredPermissions: ["tabs.config.view", "users.manage"],
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

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {

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

            if (userRole === "Administrativo" && item.label === "Estudios") {
                return { ...item, path: "/estudios/redaccion", subItems: undefined };
            }

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
                "fixed top-0 left-0 z-40 h-dvh w-[min(20rem,88vw)] border-border pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 lg:w-52 lg:py-0",
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
                    <div className="h-14 flex items-center px-3 border-b border-purple-800/30">
                        <div className="flex items-center flex-1 cursor-pointer" onClick={() => navigate(userRole === "patient" ? "/estudios" : "/inicio")}>
                            <img src={logo} alt="NextRIS Logo" className="w-6 h-6 brightness-105" />
                            <span className="ml-2 font-display text-base font-bold text-white">
                                Next<span className="text-purple-400">RIS</span>
                            </span>
                        </div>
                        <button
                            onClick={cycleTheme}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-white transition-colors hover:bg-purple-700/50 lg:h-auto lg:w-auto lg:p-1.5"
                            title={themeLabel}
                        >
                            {themeIcon}
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
                                                onClick={() => toggleItem(item.label)}
                                                className="group flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-white transition-all duration-300 hover:bg-purple-700 lg:min-h-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <item.icon className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
                                                    <span className="text-xs font-medium">{item.label}</span>
                                                </div>
                                                {expandedItems.includes(item.label) ? (
                                                    <ChevronDown className="w-3 h-3 transition-transform duration-300" />
                                                ) : (
                                                    <ChevronRight className="w-3 h-3 transition-transform duration-300" />
                                                )}
                                            </button>
                                            <div className={cn(
                                                "overflow-hidden transition-all duration-300 ease-in-out",
                                                expandedItems.includes(item.label)
                                                    ? "max-h-96 opacity-100"
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
                                                                <span className="text-xs">{subItem.label}</span>
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
                                            className={cn(
                                                "group flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-white transition-all duration-300 lg:min-h-0",
                                                location.pathname === item.path
                                                    ? "bg-purple-700"
                                                    : "hover:bg-purple-700"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "w-4 h-4 transition-transform duration-300 text-white group-hover:scale-110"
                                            )} />
                                            <span className="text-xs font-medium">{item.label}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Section */}
                    <div className="p-2 border-t border-purple-800/30">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-800/30">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">{authData?.user.username.charAt(0).toUpperCase()}{authData?.user.username.charAt(1).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">{authData?.user.username}</p>
                                <p className="text-[10px] text-purple-300">{authData?.user?.user_type}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsAboutModalOpen(true)}
                            className="group mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-purple-300 transition-all duration-300 hover:bg-purple-700 lg:min-h-0"
                        >
                            <Info className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                            <span>Acerca de NextRIS</span>
                        </button>

                        <button
                            onClick={() => {
                                logout();
                                navigate('/');
                            }}
                            className="group mt-1 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-400 transition-all duration-300 hover:bg-red-900/30 lg:min-h-0"
                        >
                            <Power className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                            <span>Desconectarse</span>
                        </button>
                    </div>
                </div>
            </aside>

            <Modal
                isOpen={isAboutModalOpen}
                onClose={() => setIsAboutModalOpen(false)}
                title="Acerca de NextRIS"
                size="sm"
            >
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        <strong>NextRIS</strong> es un sistema de información radiológica
                        desarrollado por <strong>Soft in Health</strong>.
                    </p>
                    <p>
                        <strong>Líder del proyecto:</strong> Facundo Farias
                    </p>
                    <p>
                        <strong>Especialidad:</strong> Informática médica
                    </p>
                </div>
            </Modal>
        </>
    );
};
