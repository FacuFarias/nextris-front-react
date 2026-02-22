import type { TableAction, TableColumn } from "@/types/table";
import type { Patient } from "../types/BuscarPaciente";
import { Delete, Edit, History, UserPlus } from "lucide-react";

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
        key: "patientid",
        label: "PATIENT ID",
        className: "font-medium font-mono text-xs",
        hideOnMobile: true,
        sortable: true,
    },
    {
        key: "username",
        label: "USUARIO",
        className: "font-medium",
        hideOnMobile: true,
        sortable: true,
        render: (value: string | null | undefined) => value ?? "-",
    },
    {
        key: "user_status",
        label: "ESTADO USUARIO",
        className: "font-medium",
        hideOnMobile: true,
        sortable: true,
        render: (value: string | null | undefined) => {
            if (!value) return <span className="text-muted-foreground text-xs">Sin usuario</span>;
            const isActive = value === "Active";
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"}`}>
                    {isActive ? "Activo" : "Inactivo"}
                </span>
            );
        },
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
    onViewHistory: (patient: Patient) => void,
    onCreateUser: (patient: Patient) => void,
    canManage: boolean = true,
): TableAction<Patient>[] => [
        ...(canManage
            ? [
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
                    label: "Crear usuario",
                    icon: <UserPlus className="h-4 w-4 text-purple-700" />,
                    onClick: onCreateUser,
                    disabled: (patient: Patient) => !!patient.username,
                },
            ]
            : []),
        {
            label: "Historial",
            icon: <History className="h-4 w-4 text-green-700" />,
            onClick: onViewHistory,
            disabled: (patient: Patient) => patient.study_count === 0,
        },
    ];

export { patientColumns };
