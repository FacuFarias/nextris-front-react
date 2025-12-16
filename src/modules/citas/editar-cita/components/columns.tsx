import type { TableAction, TableColumn } from "@/types/table";
import type { Cita } from "../types/cita.type";
import { Calendar, Delete, Edit } from "lucide-react";


// Configuración de columnas para usuarios
const citaColumns: TableColumn<Cita>[] = [
    {
        key: "patient_name",
        label: "NOMBRE",
        className: "font-medium",
    },
    {
        key: "start",
        label: "TURNO",
        className: "font-medium",
        render: (value: string) => {
            const date = new Date(value);
            return date.toLocaleString("es-AR", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });

        },
    },
    {
        key: "doctor",
        label: "DOCTOR",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "exam",
        label: "EXAMEN",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "equipment",
        label: "EQUIPO",
        className: "font-medium",
        hideOnMobile: true,
    },
];

// Función que genera las acciones con handlers personalizados
export const getCitasActions = (
    onEdit: (patient: Cita) => void,
    onEditDate?: (patient: Cita) => void,
    onDelete?: (patient: Cita) => void,

): TableAction<Cita>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEdit,
        },
        {
            label: "Editar fecha",
            icon: <Calendar className="h-4 w-4 text-green-700" />,
            onClick: onEditDate!,
        },
        {
            label: "Eliminar cita",
            icon: <Delete className="h-4 w-4 text-red-800" />,
            onClick: onDelete!,
        },

    ];
export { citaColumns };
