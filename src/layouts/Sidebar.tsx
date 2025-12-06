import { useState } from "react";
import {
    Home,
    Users,
    Calendar,
    UserPlus,
    Send,
    Settings,
    Power,
    FileText,
    ChevronDown,
    ChevronRight,
    UserSearch,
    UserCog,
    ClipboardList,
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
    subItems?: { icon: React.ElementType; label: string; path: string }[];
}

const menuItems: MenuItem[] = [
    {
        icon: Users,
        label: "Pacientes",
        subItems: [
            { icon: UserSearch, label: "Buscar Pacientes", path: "/pacientes/buscar-paciente" },
            { icon: UserCog, label: "Unificación de Paciente", path: "/pacientes/unificacion" },
            { icon: ClipboardList, label: "Reasignación de Exámenes", path: "/pacientes/reasignacion" },
        ]
    },
    { icon: Calendar, label: "Citas", path: "/citas" },
    { icon: UserPlus, label: "Admision", path: "/admision" },
    { icon: Home, label: "Ubicacion", path: "/ubicacion" },
    { icon: FileText, label: "Redaccion", path: "/redaccion" },
    { icon: Send, label: "Distribucion", path: "/distribucion" },
    { icon: Settings, label: "Configuraciones", path: "/configuraciones" },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {

    const { authData, logout } = useAuth();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
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
                "fixed top-0 left-0 h-full w-64 border-r border-border z-40 transition-transform duration-300",
                "lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
                style={{ backgroundColor: '#F9FAFA' }}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-20 flex items-center px-6 border-b border-border  cursor-pointer" onClick={() => navigate("/inicio")}>
                        <img src={logo} alt="NextRIS Logo" className="w-8 h-8" />
                        <span className="ml-3 font-display text-xl font-bold text-foreground">
                            Next<span className="text-primary">RIS</span>
                        </span>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-3">
                            {menuItems.map((item) => (
                                <li key={item.label}>
                                    {item.subItems ? (
                                        <>
                                            <button
                                                onClick={() => toggleItem(item.label)}
                                                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-300 group text-muted-foreground hover:bg-purple-900 hover:text-white cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-white transition-transform duration-300 group-hover:scale-110" />
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
                                                                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 group cursor-pointer",
                                                                    location.pathname === subItem.path
                                                                        ? "bg-purple-900 text-white"
                                                                        : "text-muted-foreground hover:bg-purple-900 hover:text-white"
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
                                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group cursor-pointer",
                                                location.pathname === item.path
                                                    ? "bg-purple-900 text-white"
                                                    : "text-muted-foreground hover:bg-purple-900 hover:text-white"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "w-5 h-5 transition-transform duration-300",
                                                location.pathname === item.path ? "text-white" : "text-muted-foreground group-hover:text-white group-hover:scale-110"
                                            )} />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground font-semibold">{authData?.user.username.charAt(0).toUpperCase()}{authData?.user.username.charAt(1).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{authData?.user.username}</p>
                                <p className="text-xs text-muted-foreground">{authData?.user.name}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                logout();
                                navigate('/');
                            }}
                            className="cursor-pointer w-full mt-3 flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all duration-300 group"
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
