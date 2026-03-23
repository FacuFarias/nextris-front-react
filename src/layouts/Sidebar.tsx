import { useState, useMemo } from "react";
import {
    Users,
    Calendar,
    Settings,
    Power,
    ChevronDown,
    ChevronRight,
    UserCog,
    ClipboardList,
    CalendarPlus,
    HandHelping,
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
    FileCode2,
    ListTree,
    Scale,
    Files,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo/logo5.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserModules } from "@/hooks/use-user-modules";

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
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo"],
    },
    {
        icon: Users,
        label: "Pacientes",
        path: "/buscar-pacientes",
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo"],
    },
    {
        icon: Calendar, label: "Citas",
        allowedRoles: ["Sysadmin", "Administrativo"],
        requiredModule: "appointments",
        subItems: [
            {
                icon: Calendar,
                label: "Agendar Cita",
                path: "/cita/nueva-cita",
                requiredModule: "appointments",
            },
            {
                icon: Calendar,
                label: "Editar Citas",
                path: "/cita/editar-cita",
                requiredModule: "appointments",
            },
        ]
    },
    {
        icon: CalendarPlus, label: "Admision",
        allowedRoles: ["Sysadmin", "Administrativo"],
        requiredPermissions: ["tabs.admissions.view", "admissions.view"],
        subItems: [
            {
                icon: CalendarPlus,
                label: "Adm por cita",
                path: "/nueva-admision",
                requiredPermissions: ["admissions.admit_appointments"],
                requiredModule: "appointments",
            },
            {
                icon: CalendarPlus,
                label: "Adm espontánea",
                path: "/admision-espontanea",
                requiredPermissions: ["admissions.create_spontaneous"],
            },
            {
                icon: CalendarPlus,
                label: "Historico de visitas",
                path: "/admision/historico-visitas",
                requiredModule: "appointments",
            }
        ]
    },
    { icon: HandHelping, label: "Ejecucion", path: "/ejecucion", allowedRoles: ["Sysadmin", "Tecnico"] },
    {
        icon: NotebookText, label: "Estudios", subItems: [
            {
                icon: NotebookText,
                label: "Redaccion",
                path: "/estudios/redaccion",
            },
            {
                icon: NotebookText,
                label: "Inf.Predef",
                path: "/estudios/informes-predefinidos",
            },
            {
                icon: UploadCloud,
                label: "Cargar Estudios",
                path: "/estudios/cargar-estudios",
            }
        ],
        allowedRoles: ["Sysadmin", "Medico"],
    },
    { icon: Navigation, label: "Distribucion", path: "/distribucion", allowedRoles: ["Sysadmin", "Administrativo"], },
    {
        icon: Briefcase,
        label: "Gestión",
        path: "/administracion",
        subItems: [
            {
                icon: UserCog,
                label: "Unificación de Paciente",
                path: "/administracion/unificacion-paciente",
                allowedRoles: ["Sysadmin"]
            },
            {
                icon: ClipboardList,
                label: "Reasignación de Exámenes",
                path: "/administracion/reasignacion-examenes",
                allowedRoles: ["Sysadmin"]
            },
            {
                icon: Users,
                label: "Demográficos",
                path: "/administracion/demograficos",
                allowedRoles: ["Sysadmin"]
            },
        ]
    },
    {
        icon: Settings,
        label: "Configuraciones",
        path: "/configuraciones/tablas",
        allowedRoles: ["Sysadmin"],
    },
    {
        icon: FileCode2,
        label: "Reportes estructurados",
        allowedRoles: ["Sysadmin"],
        requiredModule: "structured_reports",
        subItems: [
            {
                icon: FileCode2,
                label: "Lista de parser",
                path: "/reportes-estructurados/lista-parser",
                requiredModule: "structured_reports",
            },
            {
                icon: ListTree,
                label: "Mapeo de variables",
                path: "/reportes-estructurados/mapeo-variables",
                requiredModule: "structured_reports",
            },
            {
                icon: Scale,
                label: "Conceptos y criterios",
                path: "/reportes-estructurados/conceptos-criterios",
                requiredModule: "structured_reports",
            },
            {
                icon: Files,
                label: "Plantillas inteligentes",
                path: "/reportes-estructurados/plantillas-inteligentes",
                requiredModule: "structured_reports",
            },
        ],
    },
    {
        icon: Sparkles,
        label: "Nexi",
        path: "/nexi",
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo"],
        requiredModule: "nexi",
    },
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

        const roleAccess = hasRoleConstraint ? allowedRoles!.includes(userRole) : true;
        const permissionAccess = hasPermissionConstraint
            ? (userPermissions.includes("*") || requiredPermissions!.some((permission) => userPermissions.includes(permission)))
            : true;

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
                "fixed top-0 left-0 h-full w-52 border-border z-40 transition-transform duration-300",
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
                            className="p-1.5 rounded-lg hover:bg-purple-700/50 transition-colors text-white"
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
                                                className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg transition-all duration-300 group text-white hover:bg-purple-700 cursor-pointer"
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
                                                                    "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300 group cursor-pointer text-white",
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
                                                "flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-300 group cursor-pointer text-white",
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
                            onClick={() => {
                                logout();
                                navigate('/');
                            }}
                            className="cursor-pointer w-full mt-2 flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-900/30 rounded-lg transition-all duration-300 group"
                        >
                            <Power className="w-3 h-3 transition-transform duration-300 group-hover:scale-110" />
                            <span>Desconectarse</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};