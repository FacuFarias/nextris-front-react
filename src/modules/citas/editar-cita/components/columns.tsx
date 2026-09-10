import type { TableAction, TableColumn } from "@/types/table";
import type { Cita } from "../types/cita.type";
import { Calendar, Delete, Edit } from "lucide-react";
import { formatDateTime } from "@/lib/fechaYhora";


// Configuración de columnas para usuarios
const citaColumns: TableColumn<Cita>[] = [
    {
        key: "patient_name",
        label: "NOMBRE",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { role: "title", order: 1 },
    },
    {
        key: "start",
        label: "TURNO",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { label: "Turno", order: 2 },
        render: (value: string) => {
            if (!value) return "";

            const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
            if (match) {
                const [, year, month, day, hour, minute] = match;
                return `${day}/${month}/${year}, ${hour}:${minute}`;
            }

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;

            return formatDateTime(date);

        },
    },
    {
        key: "doctor",
        label: "DOCTOR",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Doctor", order: 4 },
        sortable: true,
        filterable: true,
    },
    {
        key: "exam",
        label: "EXAMEN",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Examen", order: 3 },
        sortable: true,
        filterable: true,
    },
    {
        key: "equipment",
        label: "EQUIPO",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { role: "hidden" },
        sortable: true,
        filterable: true,
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
            mobilePrimary: true,
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
