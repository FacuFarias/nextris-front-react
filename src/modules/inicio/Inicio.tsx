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
    Sparkles,
    FileCode,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUserModules } from "@/hooks/use-user-modules";

interface MenuItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    path?: string;
    allowedRoles?: string[]; // Si está vacío, todos pueden verlo
    requiredPermissions?: string[];
    requiredModule?: string;

}

interface MenuSection {
    id: string;
    title: string;
    items: MenuItem[];
}

interface ExtraModulePromo {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    requiredModule: string;
    allowedRoles?: string[];
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
                path: "/buscar-pacientes",
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
                requiredModule: "appointments",
            },
            {
                id: "editar-cita",
                title: "Editar Cita",
                description: "Reprograma o ajusta turnos existentes",
                icon: <CalendarCheck className="w-5 h-5" />,
                path: "/cita/editar-cita",
                allowedRoles: ["Sysadmin", "Administrativo"],
                requiredModule: "appointments",
            },
            {
                id: "adm-cita",
                title: "Adm. por Cita",
                path: "/nueva-admision",
                description: "Gestiona admisiones desde agenda",
                icon: <UserPlus className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo"],
                requiredPermissions: ["tabs.admissions.view", "admissions.view", "admissions.admit_appointments"],
                requiredModule: "appointments",
            },
            {
                id: "adm-espontanea",
                title: "Admisión Espontánea",
                path: "/admision-espontanea",
                description: "Registra ingresos sin cita previa",
                icon: <UserCog className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo"],
                requiredPermissions: ["tabs.admissions.view", "admissions.view", "admissions.create_spontaneous"],
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
                requiredModule: "patient_portal",
            },
            {
                id: "mis-datos",
                title: "Mis datos",
                description: "Consulta tus datos personales",
                icon: <UserCog className="w-5 h-5" />,
                path: "/mis-datos",
                allowedRoles: ["patient"],
                requiredModule: "patient_portal",
            },

        ],
    },
];

const extraModulePromos: ExtraModulePromo[] = [
    {
        id: "promo-nexi",
        title: "Nexi IA",
        description: "Asistente inteligente para ayudarte en flujos clínicos y operativos.",
        icon: <Sparkles className="w-5 h-5" />,
        path: "/nexi",
        requiredModule: "nexi",
        allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo"],
    },
    {
        id: "promo-structured-reports",
        title: "Reportes Estructurados",
        description: "Automatiza reglas y criterios para informes avanzados.",
        icon: <FileCode className="w-5 h-5" />,
        path: "/reportes-estructurados/lista-parser",
        requiredModule: "structured_reports",
        allowedRoles: ["Sysadmin"],
    },
    {
        id: "promo-appointments",
        title: "Agendas Inteligentes",
        description: "Optimiza turnos y recursos con una agenda clínica más inteligente.",
        icon: <Calendar className="w-5 h-5" />,
        path: "/cita/nueva-cita",
        requiredModule: "appointments",
        allowedRoles: ["Sysadmin", "Administrativo"],
    },
    {
        id: "promo-patient-portal",
        title: "Portal del Paciente",
        description: "Acceso a estudios y datos personales desde el entorno de paciente.",
        icon: <UserCog className="w-5 h-5" />,
        path: "/estudios",
        requiredModule: "patient_portal",
        allowedRoles: ["patient"],
    },
];

export const Inicio = () => {

    const { authData, logout } = useAuth();
    const { moduleCodesSet, isLoading: isModulesLoading, hasError: hasModulesError } = useUserModules(Boolean(authData));
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedPromo] = useState<ExtraModulePromo>(
        () => extraModulePromos[Math.floor(Math.random() * extraModulePromos.length)]
    );

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
    const hasAccess = (allowedRoles?: string[], requiredPermissions?: string[]) => {
        const role = authData?.user?.user_type;
        const userPermissions = Array.isArray((authData?.user as any)?.permissions)
            ? ((authData?.user as any)?.permissions as string[])
            : [];

        const hasRoleConstraint = Array.isArray(allowedRoles) && allowedRoles.length > 0;
        const hasPermissionConstraint = Array.isArray(requiredPermissions) && requiredPermissions.length > 0;

        const roleAccess = hasRoleConstraint ? Boolean(role && allowedRoles!.includes(role)) : true;
        const permissionAccess = hasPermissionConstraint
            ? (userPermissions.includes("*") || requiredPermissions!.some((permission) => userPermissions.includes(permission)))
            : true;

        return roleAccess && permissionAccess;
    };

    const hasModuleAccess = (requiredModule?: string) => {
        if (!requiredModule) return true;
        if (isModulesLoading || hasModulesError) return false;
        return moduleCodesSet.has(requiredModule);
    };

    const canOpenSelectedPromo = Boolean(
        selectedPromo &&
        hasAccess(selectedPromo.allowedRoles) &&
        hasModuleAccess(selectedPromo.requiredModule)
    );

    // Filtrar secciones y items según el rol del usuario
    const filteredSections = menuSections
        .map(section => ({
            ...section,
            items: section.items.filter(item =>
                hasAccess(item.allowedRoles, item.requiredPermissions) && hasModuleAccess(item.requiredModule)
            )
        }))
        .filter(section => section.items.length > 0); // Solo mostrar secciones que tengan items visibles


    // Calcular offset de índice global para el stagger entre secciones
    const sectionOffsets = filteredSections.reduce<number[]>((acc, _, i) => {
        acc.push(i === 0 ? 0 : acc[i - 1] + filteredSections[i - 1].items.length);
        return acc;
    }, []);

    return (
        <MainLayout>
            <div className="space-y-4">
                <div className="inicio-container rounded-2xl bg-card/95 backdrop-blur-sm p-4 space-y-3 border border-border shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">
                            Bienvenido{" "}
                            <span className="dark:text-purple-300">{authData?.user?.user_type}: {authData?.user.username}</span>
                        </h1>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 text-brand-purple dark:text-purple-400">
                                <Clock className="w-5 h-5 dark:drop-shadow-[0_0_6px_rgba(167,139,250,0.5)]" />
                                <span className="text-2xl font-bold font-mono dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]">
                                    {formatTime()}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground capitalize">{formatDate()}</span>
                        </div>
                    </div>

                    <div className="module-grid grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {filteredSections.map((section, sectionIndex) => (
                            <section
                                key={section.id}
                                className="module-panel rounded-xl border border-border p-3"
                            >
                                <h2 className="section-title-dark text-xs font-semibold text-brand-purple dark:text-purple-400 mb-2 uppercase tracking-widest">
                                    Módulo: {section.title}
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {section.items.map((item, itemIndex) => {
                                        const globalIdx = sectionOffsets[sectionIndex] + itemIndex;
                                        const animDelay = `${globalIdx * 55}ms`;
                                        const cardClasses =
                                            "menu-card animate-fade-in-up group cursor-pointer rounded-lg border border-border p-2.5 flex items-center gap-2 min-h-[68px] hover:bg-accent/50 dark:hover:bg-transparent transition-all duration-300";

                                        const iconNode = (
                                            <>
                                                <div className="menu-card-icon bg-purple-100 rounded-md p-2 shrink-0 transition-all duration-300">
                                                    <div className="text-brand-purple dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                                        {item.icon}
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </>
                                        );

                                        if (item.path) {
                                            return (
                                                <Link
                                                    key={item.id}
                                                    to={item.path}
                                                    onClick={() => handleItemClick(item)}
                                                    className={cardClasses}
                                                    style={{ animationDelay: animDelay }}
                                                >
                                                    {iconNode}
                                                </Link>
                                            );
                                        }

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleItemClick(item)}
                                                className={cardClasses}
                                                style={{ animationDelay: animDelay }}
                                            >
                                                {iconNode}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>

                        {selectedPromo && (
                            <section className="extra-module-banner rounded-xl border border-border p-3 lg:col-span-2">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-start gap-3">
                                    <div className="extra-module-icon rounded-md p-2 shrink-0">
                                        <div className="text-brand-purple dark:text-purple-300">{selectedPromo.icon}</div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                                            Módulo Extra
                                        </p>
                                        <h3 className="text-sm font-semibold text-foreground">{selectedPromo.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">{selectedPromo.description}</p>
                                    </div>
                                </div>

                                {canOpenSelectedPromo ? (
                                    <Link
                                        to={selectedPromo.path}
                                        className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-brand-purple dark:text-purple-300 hover:bg-accent/60 transition-colors"
                                    >
                                        Ir al módulo
                                    </Link>
                                ) : (
                                    <a
                                        href="https://nextris.cloud"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-brand-purple dark:text-purple-300 hover:bg-accent/60 transition-colors"
                                    >
                                        Leer más
                                    </a>
                                )}
                            </div>
                            </section>
                        )}
                </div>
            </div>
        </MainLayout>
    );
};
