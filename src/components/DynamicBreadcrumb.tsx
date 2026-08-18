import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Mapeo de rutas a nombres legibles
const routeNames: Record<string, string> = {
    inicio: "Inicio",
    pacientes: "Pacientes",
    "buscar-pacientes": "Pacientes",
    "historial-paciente": "Historial",
    citas: "Citas",
    cita: "Cita",
    admision: "Admisión",
    ejecucion: "Ejecución",
    redaccion: "Redacción",
    distribucion: "Distribución",
    configuraciones: "Configuraciones",
    unificacion: "Unificación de Paciente",
    reasignacion: "Reasignación de Exámenes",
};

// Rutas que no deben ser clicables
const disabledRoutes = ["cita", "redaccion"];

export const DynamicBreadcrumb = () => {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    // Si estamos en la raíz, no mostrar breadcrumb
    if (pathnames.length === 0) return null;

    return (
        <Breadcrumb className="mb-4 hidden md:block">
            <BreadcrumbList>
                {/* Home siempre visible */}
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link to="/inicio" className="flex items-center gap-1 hover:text-brand-purple dark:hover:text-purple-400 transition-colors">
                            <Home className="w-4 h-4" />
                            <span>Inicio</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {pathnames.map((pathname, index) => {
                    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
                    const isLast = index === pathnames.length - 1;
                    const isDisabled = disabledRoutes.includes(pathname);
                    const displayName = routeNames[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);

                    return (
                        <div key={routeTo} className="flex items-center">
                            <BreadcrumbSeparator>
                                <ChevronRight className="w-4 h-4" />
                            </BreadcrumbSeparator>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="text-brand-purple dark:text-purple-400 font-medium">
                                        {displayName}
                                    </BreadcrumbPage>
                                ) : isDisabled ? (
                                    <span className="text-muted-foreground cursor-not-allowed">
                                        {displayName}
                                    </span>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link to={routeTo} className="hover:text-brand-purple dark:hover:text-purple-400 transition-colors">
                                            {displayName}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </div>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
};
