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
    Calculator,
    FileBarChart,
    Wrench,
    Settings,
    LogOut,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

interface MenuItem {
    id: string;
    title: string;
    icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
    { id: "buscar", title: "Buscar Pacientes", icon: <Users className="w-6 h-6" /> },
    { id: "unificacion", title: "Unificación de Paciente", icon: <UserCheck className="w-6 h-6" /> },
    { id: "reasignacion", title: "Reasignación de Exámenes", icon: <ClipboardList className="w-6 h-6" /> },
    { id: "nueva-cita", title: "Nueva Cita", icon: <Calendar className="w-6 h-6" /> },
    { id: "editar-cita", title: "Editar Cita", icon: <CalendarCheck className="w-6 h-6" /> },
    { id: "adm-cita", title: "Adm. por Cita", icon: <UserPlus className="w-6 h-6" /> },
    { id: "adm-espontanea", title: "Admisión Espontánea", icon: <UserCog className="w-6 h-6" /> },
    { id: "historico", title: "Histórico de Visitas", icon: <UserCog className="w-6 h-6" /> },
    { id: "ejecucion", title: "Ejecución", icon: <MousePointer className="w-6 h-6" /> },
    { id: "redaccion", title: "Redacción Radiología", icon: <FileText className="w-6 h-6" /> },
    { id: "inf-predef", title: "Inf. Predef", icon: <FileEdit className="w-6 h-6" /> },
    { id: "distribucion", title: "Distribución", icon: <Send className="w-6 h-6" /> },
    { id: "facturar", title: "Facturar Orden", icon: <Calculator className="w-6 h-6" /> },
    { id: "historial", title: "Historial Facturación", icon: <FileBarChart className="w-6 h-6" /> },
    { id: "analisis", title: "Análisis Facturación", icon: <Calculator className="w-6 h-6" /> },
    { id: "configuraciones", title: "Configuraciones", icon: <Wrench className="w-6 h-6" /> },
    { id: "preferencias", title: "Preferencias", icon: <Settings className="w-6 h-6" /> },
    { id: "desconectar", title: "Desconectarse", icon: <LogOut className="w-6 h-6" /> },
];

export const Inicio = () => {

    const { authData } = useAuth();


    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Bienvenido: <span className="text-brand-purple">{authData?.user.username}</span>
                    </h1>
                </div>

                {/* Grid de Tarjetas */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {menuItems.map((item) => (
                        <Card
                            key={item.id}
                            className="group cursor-pointer bg-white/95 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-300 border-none p-3 flex flex-col items-center justify-center gap-2 h-28"
                        >
                            <div className="bg-purple-100 rounded-lg p-2 group-hover:bg-purple-200 transition-all duration-300">
                                <div className="text-brand-purple group-hover:scale-110 transition-transform duration-300">
                                    {item.icon}
                                </div>
                            </div>
                            <h3 className="text-xs font-medium text-gray-700 text-center leading-tight">
                                {item.title}
                            </h3>
                        </Card>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
};
