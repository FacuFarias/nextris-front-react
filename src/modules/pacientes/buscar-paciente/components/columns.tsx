import type { TableAction, TableColumn } from "@/types/table";
import type { Patient } from "../types/BuscarPaciente";
import { Delete, Edit, History } from "lucide-react";

// Configuración de columnas para usuarios
const patientColumns: TableColumn<Patient>[] = [
    {
        key: "name",
        label: "NOMBRE",
        className: "font-medium",
        sortable: true,
    },
    {
        key: "surname",
        label: "APELLIDO",
        className: "font-medium",
        sortable: true,
    },
    {
        key: "gender",
        label: "GENERO",
        className: "font-medium",
        hideOnMobile: true,
        sortable: true,
    },
    {
        key: "birthdate",
        label: "FECHA DE NACIMIENTO",
        className: "font-medium",
        hideOnMobile: true,
        sortable: true,
    },
    {
        key: "study_count",
        label: "CANTIDAD DE ESTUDIOS",
        className: "font-medium",
        render: (value: number) => value.toString(),
        hideOnMobile: true,
        sortable: true,
    },
];

// Función que genera las acciones con handlers personalizados
export const getPatientActions = (
    onEdit: (patient: Patient) => void,
    onDelete: (patient: Patient) => void,
    onViewHistory: (patient: Patient) => void
): TableAction<Patient>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEdit,
        },
        {
            label: "Eliminar",
            icon: <Delete className="h-4 w-4 text-red-700" />,
            onClick: onDelete,
        },
        {
            label: "Historial",
            icon: <History className="h-4 w-4 text-green-700" />,
            onClick: onViewHistory,
            disabled: (patient: Patient) => patient.study_count === 0,
        },
    ];

export { patientColumns };
