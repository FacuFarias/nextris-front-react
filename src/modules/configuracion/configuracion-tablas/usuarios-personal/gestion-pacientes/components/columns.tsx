import type { TableColumn, TableAction } from "@/types/table";
import type { Patient } from "../types/patients.types";
import { Edit, Lock, Trash2 } from "lucide-react";

export const getPatientColumns = (): TableColumn<Patient>[] => [
    {
        key: "username",
        label: "USUARIO",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
    {
        key: "name",
        label: "NOMBRE",
        className: "font-medium",
        sortable: true,
        filterable: true,
        render: (_value, row) => `${row.name}`,
    },
    {
        key: "national_number",
        label: "DNI/CI",
        className: "font-medium",
        sortable: true,
        filterable: true,
        render: (value) => value || "-",
    },
    {
        key: "email",
        label: "EMAIL",
        className: "font-medium",
        sortable: true,
        filterable: true,
        render: (value) => value || "-",
    },
    {
        key: "phone",
        label: "TELÉFONO",
        className: "font-medium",
        filterable: true,
        render: (value) => value || "-",
    },
    {
        key: "birthdate",
        label: "FECHA NAC.",
        className: "font-medium",
        sortable: true,
        render: (value) => {
            if (!value) return "-";
            return new Date(value.toString()).toLocaleDateString();
        },
    },
    {
        key: "gender",
        label: "GÉNERO",
        className: "font-medium",
        sortable: true,
        render: (value) => {
            if (!value) return "-";
            const genders = { M: "Masculino", F: "Femenino", O: "Otro" };
            return genders[value as 'M' | 'F' | 'O'] || value;
        },
    },
    {
        key: "is_active",
        label: "ESTADO",
        className: "font-medium",
        sortable: true,
        render: (_value, row) => (
            <span className={`px-2 py-1 rounded-full text-xs ${row.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {row.is_active ? 'Activo' : 'Inactivo'}
            </span>
        ),
    },
];

export const getPatientActions = (
    onEditar: (patient: Patient) => void,
    onResetPassword: (patient: Patient) => void,
    onEliminar: (patient: Patient) => void,
): TableAction<Patient>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEditar,
        },
        {
            label: "Resetear Contraseña",
            icon: <Lock className="h-4 w-4 text-purple-600" />,
            onClick: onResetPassword,
        },
        {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4 text-red-600" />,
            onClick: onEliminar,
        },
    ];
