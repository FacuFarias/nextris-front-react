import { Edit2, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface Patient {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    sexo: string;
    fechaNac: string;
    telefono?: string;
    email: string;
    tarjeta: string;
    estudios: number;
}

export interface Column {
    key: keyof Patient | "acciones";
    header: string;
    hideOnMobile?: boolean; // Ocultar en pantallas pequeñas/medianas
    render?: (value: any, patient: Patient) => React.ReactNode;
}

export const columns: Column[] = [
    {
        key: "nombre",
        header: "NOMBRE",
    },
    {
        key: "apellido",
        header: "APELLIDO",
    },
    {
        key: "dni",
        header: "DNI",
    },
    {
        key: "sexo",
        header: "SEXO",
        hideOnMobile: true,
    },
    {
        key: "fechaNac",
        header: "FECHA NAC.",
        hideOnMobile: true,
    },
    {
        key: "telefono",
        header: "TELÉFONO",
        hideOnMobile: true,
    },
    {
        key: "email",
        header: "EMAIL",
        hideOnMobile: true,
    },
    {
        key: "tarjeta",
        header: "TARJETA",
        hideOnMobile: true,
    },
    {
        key: "estudios",
        header: "ESTUDIOS",
        hideOnMobile: true,
    },
    {
        key: "acciones",
        header: "Acciones",
        render: (_, patient) => (
            <TooltipProvider>
                <div className="flex items-center gap-2 justify-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                                onClick={() => console.log("Editar", patient.id)}
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Editar paciente</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => console.log("Eliminar", patient.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Eliminar paciente</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => console.log("Ver historial", patient.id)}
                            >
                                <History className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Ver historial</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        ),
    },
];
