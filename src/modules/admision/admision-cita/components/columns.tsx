import type { TableAction, TableColumn } from "@/types/table";
import type { Admision } from "../types/admision.type";
import { Check, Delete, Printer } from "lucide-react";
import { formatPatientName } from "@/lib/formatPatientName";

// Configuración de columnas para usuarios
const admisionColumns: TableColumn<Admision>[] = [
    {
        key: "fullname",
        label: "PACIENTE",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { role: "title", order: 1 },
        render: (value) => formatPatientName(value),
    },
    {
        key: "medref",
        label: "MEDICO REFERENTE",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { label: "Médico referente", order: 3 },
    },
    {
        key: "equipment_name",
        label: "EQUIPO",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { label: "Equipo", order: 2 },
    },
    {
        key: "med_solicitante",
        label: "MEDICO SOLICITANTE",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { label: "Médico solicitante", order: 4 },
    },
];

// Función que genera las acciones con handlers personalizados
export const getAdmisionActions = (
    onVerDetalle: (patient: Admision) => void,
): TableAction<Admision>[] => [
        {
            label: "Admisionar",
            icon: <Check className="h-4 w-4 text-blue-900" />,
            onClick: onVerDetalle,
            mobilePrimary: true,
        },
        {
            label: "Eliminar",
            icon: <Delete className="h-4 w-4 text-red-900" />,
            onClick: onVerDetalle,
        },
        {
            label: "Imprimir",
            icon: <Printer className="h-4 w-4 text-green-900" />,
            onClick: onVerDetalle,
        },
    ];



export { admisionColumns };
