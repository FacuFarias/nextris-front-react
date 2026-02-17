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
    Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface MenuItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    path?: string;
    allowedRoles?: string[]; // Si está vacío, todos pueden verlo

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
                allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo"],
            },
            {
                id: "unificacion",
                title: "Unificación de Paciente",
                description: "Consolida registros duplicados",
                icon: <UserCheck className="w-5 h-5" />,
                path: "/administracion/unificacion-paciente",
                allowedRoles: ["Sysadmin"],
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
                path: "/cita/nueva-cita",
                icon: <Calendar className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo"],
            },
            {
                id: "editar-cita",
                title: "Editar Cita",
                description: "Reprograma o ajusta turnos existentes",
                icon: <CalendarCheck className="w-5 h-5" />,
                path: "/cita/editar-cita",
                allowedRoles: ["Sysadmin", "Administrativo"],
            },
            {
                id: "adm-cita",
                title: "Adm. por Cita",
                path: "/nueva-admision",
                description: "Gestiona admisiones desde agenda",
                icon: <UserPlus className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo"],
            },
            {
                id: "adm-espontanea",
                title: "Admisión Espontánea",
                path: "/admision-espontanea",
                description: "Registra ingresos sin cita previa",
                icon: <UserCog className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo"],
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
                path: "/administracion/reasignacion-examenes",
                icon: <ClipboardList className="w-5 h-5" />,
                allowedRoles: ["Sysadmin"],
            },
            {
                id: "ejecucion",
                title: "Ejecución",
                description: "Gestiona flujo operativo de estudios",
                icon: <MousePointer className="w-5 h-5" />,
                path: "/ejecucion",
                allowedRoles: ["Sysadmin", "Tecnico"],
            },
            {
                id: "redaccion",
                title: "Redacción Radiología",
                path: "/estudios/redaccion",
                description: "Redacta e interpreta informes",
                icon: <FileText className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Medico"],
            },
            {
                id: "inf-predef",
                title: "Inf. Predef",
                description: "Usa plantillas para informes rápidos",
                icon: <FileEdit className="w-5 h-5" />,
                path: "/estudios/informes-predefinidos",
                allowedRoles: ["Sysadmin", "Medico"],
            },
            {
                id: "car-estudios",
                title: "Carga Estudios",
                description: "Carga estudios DICOM",
                icon: <FileEdit className="w-5 h-5" />,
                path: "/estudios/cargar-estudios",
                allowedRoles: ["Sysadmin", "Medico"],
            },
            {
                id: "distribucion",
                title: "Distribución",
                description: "Envía resultados y reportes",
                path: "/distribucion",
                icon: <Send className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo"],
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
                path: "/configuraciones/tablas",
                allowedRoles: ["Sysadmin"],
            },
            {
                id: "preferencias",
                title: "Preferencias",
                description: "Ajusta opciones personales",
                icon: <Settings className="w-5 h-5" />,
                // Todos pueden ver preferencias
            },
            {
                id: "desconectar",
                title: "Desconectarse",
                description: "Cerrar sesión de forma segura",
                icon: <LogOut className="w-5 h-5" />,
                // Todos pueden cerrar sesión
            },
        ],
    },

    //paciente solamente puede ver sus estudios y sus datos
    {
        id: "mis-estudios",
        title: "Información Personal y Estudios",
        items: [
            {
                id: "ver-estudios",
                title: "Ver Estudios",
                description: "Consulta tus estudios registrados",
                icon: <FileText className="w-5 h-5" />,
                path: "/mis-estudios",
                allowedRoles: ["patient"],
            },
            {
                id: "mis-datos",
                title: "Mis datos",
                description: "Consulta tus datos personales",
                icon: <UserCog className="w-5 h-5" />,
                path: "/mis-datos",
                allowedRoles: ["patient"],
            },

        ],
    },
];

export const Inicio = () => {

    const { authData, logout } = useAuth();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Actualizar la hora cada segundo
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Formatear la hora según la zona horaria del usuario
    const formatTime = () => {
        return currentTime.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const formatDate = () => {
        return currentTime.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleItemClick = (item: MenuItem) => {
        if (item.id === "desconectar") {
            logout();
            navigate("/");
        }
    };

    // Función para verificar si el usuario tiene permiso para ver un item
    const hasAccess = (allowedRoles?: string[]) => {
        if (!allowedRoles || allowedRoles.length === 0) return true; // Si no hay roles definidos, todos pueden verlo
        if (!authData?.user?.user_type) return false;
        return allowedRoles.includes(authData.user.user_type);
    };

    // Filtrar secciones y items según el rol del usuario
    const filteredSections = menuSections
        .map(section => ({
            ...section,
            items: section.items.filter(item => hasAccess(item.allowedRoles))
        }))
        .filter(section => section.items.length > 0); // Solo mostrar secciones que tengan items visibles


    return (
        <MainLayout>
            <div className="space-y-4">


                <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold text-brand-purple">
                            Bienvenido <span>{authData?.user?.user_type}: {authData?.user.username}</span>
                        </h1>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 text-brand-purple">
                                <Clock className="w-5 h-5" />
                                <span className="text-2xl font-bold font-mono">{formatTime()}</span>
                            </div>
                            <span className="text-xs text-gray-500 capitalize">{formatDate()}</span>
                        </div>
                    </div>
                    {filteredSections.map((section, index) => (
                        <section
                            key={section.id}
                            className={index < filteredSections.length - 1 ? "pb-3 border-b border-gray-200" : ""}
                        >
                            <h2 className="text-xs font-semibold text-brand-purple mb-2 uppercase tracking-wide">
                                {section.title}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                {section.items.map((item) => {
                                    if (item.path) {
                                        return (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                onClick={() => handleItemClick(item)}
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
                                        );
                                    }

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => handleItemClick(item)}
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
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
};
