import { MainLayout } from "@/layouts/layout";
import {
    Users,
    UserCheck,
    ClipboardList,
    Calendar,
    CalendarCheck,
    UserPlus,
    UserCog,
    FileText,
    FileEdit,
    Send,
    Wrench,
    Settings,
    LogOut,
    Clock,
    Gauge,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUserModules } from "@/hooks/use-user-modules";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate as formatVisibleDate } from "@/lib/fechaYhora";
import agendaModuleImage from "@/assets/modules-images/agenda.png";
import portalModuleImage from "@/assets/modules-images/portal.png";

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
    requiredPermissions?: string[];
}

interface DashboardPlanUsageSummary {
    plan_code: string | null;
    plan_name: string | null;
    performed_studies: number;
    remaining_studies: number | null;
    limit_studies: number | null;
    received_studies: number;
    received_remaining: number | null;
    received_limit: number | null;
    distributed_studies: number;
    distributed_remaining: number | null;
    distributed_limit: number | null;
}

interface FacilityPlanData {
    plan: {
        plan_code: string | null;
        plan_name: string | null;
        max_read_monthly: number | null;
        max_receive_monthly: number | null;
        max_distribute_monthly: number | null;
    } | null;
    usage_monthly: {
        read_count: number;
        received_count: number;
        distributed_count: number;
    } | null;
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
                allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"],
                    requiredPermissions: ["tabs.patients.view", "patients.view"],
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
                allowedRoles: ["Sysadmin", "Administrativo", "Administrador"],
                requiredPermissions: ["tabs.appointments.view", "appointments.create"],
                requiredModule: "appointments",
            },
            {
                id: "editar-cita",
                title: "Editar Cita",
                description: "Reprograma o ajusta turnos existentes",
                icon: <CalendarCheck className="w-5 h-5" />,
                path: "/cita/editar-cita",
                allowedRoles: ["Sysadmin", "Administrativo", "Administrador"],
                    requiredPermissions: ["tabs.appointments.view", "appointments.view"],
                    requiredModule: "appointments",
            },
            {
                id: "adm-cita",
                title: "Adm. por Cita",
                path: "/nueva-admision",
                description: "Gestiona admisiones desde agenda",
                icon: <UserPlus className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo", "Administrador"],
                requiredPermissions: ["tabs.admissions.view", "admissions.view", "admissions.admit_appointments"],
                requiredModule: "appointments",
            },
            {
                id: "adm-espontanea",
                title: "Admisión Espontánea",
                path: "/admision-espontanea",
                description: "Registra ingresos sin cita previa",
                icon: <UserCog className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo", "Administrador", "Medico"],
                requiredPermissions: ["tabs.admissions.view", "admissions.view", "admissions.create_spontaneous"],
            },
        ],
    },
    {
        id: "diagnostico",
        title: "Diagnóstico y Reportes",
        items: [
            {
                id: "worklist",
                title: "Lista de trabajo",
                path: "/worklist",
                description: "Consulta y gestiona el flujo de estudios",
                icon: <FileText className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrador"],
                requiredPermissions: ["tabs.worklist.view"],
            },
            {
                id: "administrative-view",
                title: "Vista administrativa",
                path: "/administrative_view",
                description: "Consulta simplificada de estudios finalizados",
                icon: <FileText className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrador", "Administrativo"],
                requiredPermissions: ["tabs.worklist.view"],
            },
            {
                id: "distribucion",
                title: "Distribución",
                description: "Envía resultados y reportes",
                path: "/distribucion",
                icon: <Send className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrativo", "Administrador", "Medico"],
                requiredPermissions: ["tabs.distribution.view", "distribution.view"],
            },
        ],
    },
    {
        id: "sistema",
        title: "Gestión y sistema",
        items: [
            {
                id: "unificacion",
                title: "Unificación de Paciente",
                description: "Consolida registros duplicados",
                icon: <UserCheck className="w-5 h-5" />,
                path: "/administracion/unificacion-paciente",
                allowedRoles: ["Sysadmin", "Administrador"],
                requiredPermissions: ["tabs.gestion.view"],
            },
            {
                id: "reasignacion",
                title: "Reasignación de Exámenes",
                description: "Redistribuye estudios entre usuarios",
                path: "/administracion/reasignacion-examenes",
                icon: <ClipboardList className="w-5 h-5" />,
                allowedRoles: ["Sysadmin", "Administrador"],
                requiredPermissions: ["tabs.gestion.view"],
            },
            {
                id: "inf-predef",
                title: "Informes predefinidos",
                description: "Administra plantillas para informes",
                icon: <FileEdit className="w-5 h-5" />,
                path: "/gestion/informes-predefinidos",
                allowedRoles: ["Sysadmin", "Medico", "Administrador"],
                requiredPermissions: ["templates.manage"],
            },
            {
                id: "car-estudios",
                title: "Cargar estudios",
                description: "Carga y vincula estudios DICOM",
                icon: <FileEdit className="w-5 h-5" />,
                path: "/gestion/cargar-estudios",
                allowedRoles: ["Sysadmin", "Medico", "Administrador"],
                requiredPermissions: ["dicom.studies.manage"],
            },
            {
                id: "configuraciones",
                title: "Configuraciones",
                description: "Administra parámetros del sistema",
                icon: <Wrench className="w-5 h-5" />,
                path: "/configuraciones/tablas",
                allowedRoles: ["Sysadmin"],
                requiredPermissions: ["tabs.config.view", "users.manage"],
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
    // nexi — deshabilitado temporalmente
    // {
    //     id: "promo-nexi",
    //     title: "Nexi IA",
    //     description: "Asistente inteligente para ayudarte en flujos clínicos y operativos.",
    //     icon: <Sparkles className="w-5 h-5" />,
    //     path: "/nexi",
    //     requiredModule: "nexi",
    //     allowedRoles: ["Sysadmin", "Medico", "Tecnico", "Administrativo", "Administrador"],
    //     requiredPermissions: ["tabs.nexi.view"],
    // },
    // structured_reports — deshabilitado temporalmente
    // {
    //     id: "promo-structured-reports",
    //     title: "Reportes Estructurados",
    //     description: "Automatiza reglas y criterios para informes avanzados.",
    //     icon: <FileCode className="w-5 h-5" />,
    //     path: "/reportes-estructurados/lista-parser",
    //     requiredModule: "structured_reports",
    //     allowedRoles: ["Sysadmin", "Administrador"],
    //     requiredPermissions: ["tabs.structured_reports.view"],
    // },
    {
        id: "promo-appointments",
        title: "Agendas Inteligentes",
        description: "Optimiza turnos y recursos con una agenda clínica más inteligente.",
        icon: <Calendar className="w-5 h-5" />,
        path: "/cita/nueva-cita",
        requiredModule: "appointments",
        allowedRoles: ["Sysadmin", "Administrativo", "Administrador"],
        requiredPermissions: ["tabs.appointments.view", "appointments.create"],
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

const extraModuleImageByCode: Record<string, string> = {
    patient_portal: portalModuleImage,
    appointments: agendaModuleImage,
    // nexi: nexiModuleImage, — deshabilitado temporalmente
    // structured_reports: structuredReportsModuleImage, — deshabilitado temporalmente
};

export const Inicio = () => {

    const { authData, logout } = useAuth();
    const { config } = useAppConfig();
    const { moduleCodesSet, isLoading: isModulesLoading, hasError: hasModulesError } = useUserModules(Boolean(authData));
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedPromo] = useState<ExtraModulePromo>(
        () => extraModulePromos[Math.floor(Math.random() * extraModulePromos.length)]
    );

    const { data: dashboardSummary } = useQuery({
        queryKey: ["dashboard-plan-usage-summary"],
        queryFn: async () => {
            const response = await api.get('/config/dashboard/plan-usage-summary');
            return (response.data?.data || null) as DashboardPlanUsageSummary | null;
        },
        enabled: Boolean(authData),
        staleTime: 60 * 1000,
    });

    const { data: facilityPlanData } = useQuery({
        queryKey: ["facility-plan", config?.id?.toString() || "1", "inicio"],
        queryFn: async () => {
            const response = await api.get(`/config/facilities/${config?.id?.toString() || "1"}/plan`);
            return (response.data?.data || null) as FacilityPlanData | null;
        },
        enabled: Boolean(authData && config?.id?.toString() || "1"),
        staleTime: 60 * 1000,
    });

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
        return formatVisibleDate(currentTime);
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
        const isStaffUser = role !== "patient";

        const hasRoleConstraint = Array.isArray(allowedRoles) && allowedRoles.length > 0;
        const hasPermissionConstraint = Array.isArray(requiredPermissions) && requiredPermissions.length > 0;

        const roleAccess = hasRoleConstraint ? Boolean(role && allowedRoles!.includes(role)) : true;
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
        if (!requiredModule) return true;
        if (isModulesLoading || hasModulesError) return false;
        return moduleCodesSet.has(requiredModule);
    };

    const canOpenSelectedPromo = Boolean(
        selectedPromo &&
        hasAccess(selectedPromo.allowedRoles, selectedPromo.requiredPermissions) &&
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

    const formatUsedLimit = (used: number | null | undefined, limit: number | null | undefined) => {
        const safeUsed = Number.isFinite(Number(used)) ? Number(used) : 0;
        const limitText = limit == null ? "Ilimitado" : String(limit);
        return `${safeUsed}/${limitText}`;
    };

    const selectedPlanCode = String(facilityPlanData?.plan?.plan_code || dashboardSummary?.plan_code || "").toLowerCase();

    const performedStudies = facilityPlanData?.usage_monthly?.read_count ?? dashboardSummary?.performed_studies ?? 0;

    const readMonthlyLimit = facilityPlanData?.plan?.max_read_monthly ?? dashboardSummary?.limit_studies;

    const dailyReadLimit = selectedPlanCode === "free" ? 5 : selectedPlanCode === "pro" ? 10 : 5;

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

                    <div className="grid grid-cols-1 lg:grid-cols-[80%_20%] gap-3 lg:min-h-[calc(100vh-220px)] lg:items-stretch">
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-2">
                                {authData?.user?.user_type === "Medico" && (
                                    <>
                                        <div className="rounded-lg border border-purple-300/60 dark:border-purple-500/30 p-3 bg-[linear-gradient(145deg,rgba(196,181,253,0.45),rgba(255,255,255,0.92))] dark:bg-[linear-gradient(145deg,rgba(124,58,237,0.18),rgba(12,14,24,0.92))] shadow-[0_8px_20px_rgba(139,92,246,0.16)] dark:shadow-[0_8px_26px_rgba(88,28,135,0.26)]">
                                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-purple-700 dark:text-purple-200/80">
                                                <Gauge className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                                                Redacción (Mes)
                                            </div>
                                            <div className="mt-1 text-2xl font-extrabold text-purple-900 dark:text-white tracking-tight">
                                                {formatUsedLimit(performedStudies, readMonthlyLimit)}
                                            </div>
                                            <div className="text-xs text-purple-700/80 dark:text-purple-200/75">
                                                Estudios redactados en el mes
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-violet-300/60 dark:border-violet-500/30 p-3 bg-[linear-gradient(145deg,rgba(221,214,254,0.45),rgba(255,255,255,0.92))] dark:bg-[linear-gradient(145deg,rgba(139,92,246,0.16),rgba(12,14,24,0.92))] shadow-[0_8px_20px_rgba(109,40,217,0.14)] dark:shadow-[0_8px_24px_rgba(76,29,149,0.24)]">
                                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-violet-700 dark:text-violet-200/80">
                                                <ClipboardList className="w-4 h-4 text-violet-700 dark:text-violet-300" />
                                                Redaccion Diaria
                                            </div>
                                            <div className="mt-1 text-2xl font-extrabold text-violet-900 dark:text-white tracking-tight">
                                                0/{dailyReadLimit}
                                            </div>
                                            <div className="text-xs text-violet-700/80 dark:text-violet-200/75">
                                                Límite diario de redacción
                                            </div>
                                        </div>
                                    </>
                                )}
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
                        </div>

                        {selectedPromo && (
                            <section className="extra-module-banner relative overflow-hidden rounded-xl border border-border p-3 h-fit lg:h-full">
                                <div
                                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 dark:opacity-42"
                                    style={{
                                        backgroundImage: `url(${extraModuleImageByCode[selectedPromo.requiredModule] || portalModuleImage})`,
                                    }}
                                />
                                <div className="absolute inset-0 bg-transparent dark:bg-[linear-gradient(160deg,rgba(13,16,30,0.60)_0%,rgba(11,12,20,0.72)_100%)]" />

                                <div className="relative z-10 flex flex-col gap-3 lg:h-full">
                                    <div className="flex items-start gap-3">
                                        <div className="extra-module-icon rounded-md p-2 shrink-0">
                                            <div className="text-brand-purple dark:text-purple-300">{selectedPromo.icon}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.14em] text-purple-950/80 dark:text-muted-foreground font-semibold">
                                                Módulo Extra
                                            </p>
                                            <h3 className="text-lg leading-tight font-bold text-purple-950 dark:text-foreground mt-0.5">{selectedPromo.title}</h3>
                                            <p className="text-sm leading-relaxed text-purple-950/85 dark:text-muted-foreground mt-1">{selectedPromo.description}</p>
                                        </div>
                                    </div>

                                    <div className="lg:mt-auto">
                                        {canOpenSelectedPromo ? (
                                            <Link
                                                to={selectedPromo.path}
                                                className="rounded-md border border-purple-400/50 bg-gradient-to-r from-purple-700/55 to-violet-700/55 px-3 py-2 text-sm font-bold text-purple-100 hover:from-purple-600/65 hover:to-violet-600/65 hover:text-white shadow-[0_6px_20px_rgba(124,58,237,0.35)] transition-all text-center block"
                                            >
                                                Ir al módulo
                                            </Link>
                                        ) : (
                                            <a
                                                href="https://nextris.cloud"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-md border border-purple-400/50 bg-gradient-to-r from-purple-700/55 to-violet-700/55 px-3 py-2 text-sm font-bold text-purple-100 hover:from-purple-600/65 hover:to-violet-600/65 hover:text-white shadow-[0_6px_20px_rgba(124,58,237,0.35)] transition-all text-center block"
                                            >
                                                Leer más
                                            </a>
                                        )}

                                        <a
                                            href="https://nextris.cloud"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 rounded-md border border-purple-300/40 bg-black/20 px-3 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-900/25 hover:border-purple-300/60 transition-all text-center block"
                                        >
                                            Solicitar activación
                                        </a>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
