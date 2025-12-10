import { useState } from "react";
import {
    Home,
    Users,
    Calendar,
    Send,
    Settings,
    Power,
    FileText,
    ChevronDown,
    ChevronRight,

    UserCog,
    ClipboardList,
    CalendarPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo/logo5.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuItem {
    icon: React.ElementType;
    label: string;
    path?: string;
    subItems?: { icon: React.ElementType; label: string; path: string; allowedRoles?: string[] }[];
    allowedRoles?: string[]; // Si está vacío o no está definido, todos pueden verlo
}

const menuItems: MenuItem[] = [
    {
        icon: Users,
        label: "Pacientes",
        path: "/pacientes",
    },
    { icon: Calendar, label: "Citas", path: "/citas" },
    {
        icon: CalendarPlus, label: "Admision",

        subItems: [
            {
                icon: CalendarPlus,
                label: "Adm por cita",
                path: "/nueva-admision",
            },
            {
                icon: CalendarPlus,
                label: "Adm espontánea",
                path: "/admision-espontanea",
            },
            {
                icon: CalendarPlus,
                label: "Historico de visitas",
                path: "/admision/historico-visitas",
            }
        ]
    },
    { icon: Home, label: "Ubicacion", path: "/ubicacion" },
    { icon: FileText, label: "Redaccion", path: "/redaccion" },
    { icon: Send, label: "Distribucion", path: "/distribucion" },
    {
        icon: Settings,
        label: "Configuraciones",
        path: "/configuraciones",
        subItems: [
            {
                icon: UserCog,
                label: "Unificación de Paciente",
                path: "/pacientes/unificacion",
                allowedRoles: ["Administrador"]
            },
            {
                icon: ClipboardList,
                label: "Reasignación de Exámenes",
                path: "/pacientes/reasignacion",
                allowedRoles: ["Administrador"]
            },
        ]
    },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {

    const { authData, logout } = useAuth();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    const userRole = authData?.user?.name || "";

    // Función para verificar si el usuario tiene acceso
    const hasAccess = (allowedRoles?: string[]) => {
        if (!allowedRoles || allowedRoles.length === 0) return true;
        return allowedRoles.includes(userRole);
    };

    // Filtrar los items del menú según los roles
    const filteredMenuItems = menuItems.map(item => {
        if (!hasAccess(item.allowedRoles)) return null;

        if (item.subItems) {
            const filteredSubItems = item.subItems.filter(subItem => hasAccess(subItem.allowedRoles));
            // Si no hay subitems visibles, no mostrar el item padre
            if (filteredSubItems.length === 0) return null;
            return { ...item, subItems: filteredSubItems };
        }

        return item;
    }).filter(Boolean) as MenuItem[];

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
                "fixed top-0 left-0 h-full w-64  border-border z-40 transition-transform duration-300",
                "lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
                style={{ background: 'linear-gradient(to bottom, #2D1B4E 0%, #2D1B4E 40%, #1a0f2e 100%)' }}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-20 flex items-center px-6 border-b border-purple-800/30 cursor-pointer" onClick={() => navigate("/inicio")}>
                        <img src={logo} alt="NextRIS Logo" className="w-8 h-8 brightness-105" />
                        <span className="ml-3 font-display text-xl font-bold text-white">
                            Next<span className="text-purple-400">RIS</span>
                        </span>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-3">
                            {filteredMenuItems.map((item) => (
                                <li key={item.label}>
                                    {item.subItems ? (
                                        <>
                                            <button
                                                onClick={() => toggleItem(item.label)}
                                                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-300 group text-white hover:bg-purple-700 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                </div>
                                                {expandedItems.includes(item.label) ? (
                                                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 transition-transform duration-300" />
                                                )}
                                            </button>
                                            <div className={cn(
                                                "overflow-hidden transition-all duration-300 ease-in-out",
                                                expandedItems.includes(item.label)
                                                    ? "max-h-96 opacity-100"
                                                    : "max-h-0 opacity-0"
                                            )}>
                                                <ul className="mt-1 ml-4 space-y-1 pb-1">
                                                    {item.subItems.map((subItem) => (
                                                        <li key={subItem.path}>
                                                            <Link
                                                                to={subItem.path || "#"}
                                                                onClick={onClose}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 group cursor-pointer text-white",
                                                                    location.pathname === subItem.path
                                                                        ? "bg-purple-700"
                                                                        : "hover:bg-purple-700"
                                                                )}
                                                            >
                                                                <subItem.icon className={cn(
                                                                    "w-4 h-4 transition-transform duration-300",
                                                                    location.pathname === subItem.path ? "text-white" : "group-hover:text-white group-hover:scale-110"
                                                                )} />
                                                                <span className="text-sm">{subItem.label}</span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    ) : (
                                        <Link
                                            to={item.path || "#"}
                                            onClick={onClose}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group cursor-pointer text-white",
                                                location.pathname === item.path
                                                    ? "bg-purple-700"
                                                    : "hover:bg-purple-700"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "w-5 h-5 transition-transform duration-300 text-white group-hover:scale-110"
                                            )} />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-purple-800/30">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-800/30">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold">{authData?.user.username.charAt(0).toUpperCase()}{authData?.user.username.charAt(1).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{authData?.user.username}</p>
                                <p className="text-xs text-purple-300">{authData?.user.name}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                logout();
                                navigate('/');
                            }}
                            className="cursor-pointer w-full mt-3 flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition-all duration-300 group"
                        >
                            <Power className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                            <span>Desconectarse</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
