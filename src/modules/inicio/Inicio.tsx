import { MainLayout } from "@/layouts/layout";
import {
    Users,
    UserCheck,
    ClipboardList,
    Calendar,
    CalendarCheck,
    UserPlus,
    UserCog,
    MousePointer,
    FileText,
    FileEdit,
    Send,
    Wrench,
    Settings,
    LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

interface MenuItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    path?: string;
}

interface MenuSection {
    id: string;
    title: string;
    items: MenuItem[];
}

const menuSections: MenuSection[] = [
    {
        id: "pacientes",
        title: "Pacientes",
        items: [
            {
                id: "buscar",
                title: "Buscar Pacientes",
                description: "Consulta y gestiona pacientes registrados",
                icon: <Users className="w-5 h-5" />,
                path: "/pacientes",
            },
            {
                id: "unificacion",
                title: "Unificación de Paciente",
                description: "Consolida registros duplicados",
                icon: <UserCheck className="w-5 h-5" />,
            },
            {
                id: "historico",
                title: "Histórico de Visitas",
                description: "Visualiza antecedentes de atención",
                icon: <UserCog className="w-5 h-5" />,
            },
        ],
    },
    {
        id: "agenda-admision",
        title: "Citas y Admisión",
        items: [
            {
                id: "nueva-cita",
                title: "Nueva Cita",
                description: "Agenda turnos de pacientes",
                icon: <Calendar className="w-5 h-5" />,
            },
            {
                id: "editar-cita",
                title: "Editar Cita",
                description: "Reprograma o ajusta turnos existentes",
                icon: <CalendarCheck className="w-5 h-5" />,
            },
            {
                id: "adm-cita",
                title: "Adm. por Cita",
                description: "Gestiona admisiones desde agenda",
                icon: <UserPlus className="w-5 h-5" />,
            },
            {
                id: "adm-espontanea",
                title: "Admisión Espontánea",
                description: "Registra ingresos sin cita previa",
                icon: <UserCog className="w-5 h-5" />,
            },
        ],
    },
    {
        id: "diagnostico",
        title: "Diagnóstico y Reportes",
        items: [
            {
                id: "reasignacion",
                title: "Reasignación de Exámenes",
                description: "Redistribuye estudios entre usuarios",
                icon: <ClipboardList className="w-5 h-5" />,
            },
            {
                id: "ejecucion",
                title: "Ejecución",
                description: "Gestiona flujo operativo de estudios",
                icon: <MousePointer className="w-5 h-5" />,
            },
            {
                id: "redaccion",
                title: "Redacción Radiología",
                description: "Redacta e interpreta informes",
                icon: <FileText className="w-5 h-5" />,
            },
            {
                id: "inf-predef",
                title: "Inf. Predef",
                description: "Usa plantillas para informes rápidos",
                icon: <FileEdit className="w-5 h-5" />,
            },
            {
                id: "distribucion",
                title: "Distribución",
                description: "Envía resultados y reportes",
                icon: <Send className="w-5 h-5" />,
            },
        ],
    },
    {
        id: "sistema",
        title: "Sistema",
        items: [
            {
                id: "configuraciones",
                title: "Configuraciones",
                description: "Administra parámetros del sistema",
                icon: <Wrench className="w-5 h-5" />,
            },
            {
                id: "preferencias",
                title: "Preferencias",
                description: "Ajusta opciones personales",
                icon: <Settings className="w-5 h-5" />,
            },
            {
                id: "desconectar",
                title: "Desconectarse",
                description: "Cerrar sesión de forma segura",
                icon: <LogOut className="w-5 h-5" />,
            },
        ],
    },
];

export const Inicio = () => {

    const { authData } = useAuth();


    return (
        <MainLayout>
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Bienvenido: <span className="text-brand-purple">{authData?.user.username}</span>
                    </h1>
                </div>

                <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-4 space-y-3">
                    {menuSections.map((section, index) => (
                        <section
                            key={section.id}
                            className={index < menuSections.length - 1 ? "pb-3 border-b border-gray-200" : ""}
                        >
                            <h2 className="text-xs font-semibold text-brand-purple mb-2 uppercase tracking-wide">
                                {section.title}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                {section.items.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={item.path || "#"}
                                        className="group cursor-pointer rounded-lg bg-white hover:shadow-sm transition-all duration-200 border border-gray-100 p-2.5 flex items-center gap-2 min-h-[68px]"
                                    >
                                        <div className="bg-purple-100 rounded-md p-2 shrink-0 group-hover:bg-purple-200 transition-all duration-200">
                                            <div className="text-brand-purple group-hover:scale-105 transition-transform duration-200">
                                                {item.icon}
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-800 leading-tight truncate">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 leading-tight mt-0.5 truncate">
                                                {item.description}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
};
