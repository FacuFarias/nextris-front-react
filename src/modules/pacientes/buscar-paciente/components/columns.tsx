import type { TableAction, TableColumn } from "@/types/table";
import type { Patient } from "../types/BuscarPaciente";
import { Edit, History, UserX, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/fechaYhora";

// Configuración de columnas para usuarios
const patientColumns: TableColumn<Patient>[] = [
    {
        key: "name",
        label: "NOMBRE",
        className: "font-medium",
        sortable: true,
        mobile: { role: "title", order: 1 },
        render: (value: string, patient: Patient) => `${value || ""} ${patient.surname || ""}`.trim(),
    },
    {
        key: "surname",
        label: "APELLIDO",
        className: "font-medium",
        sortable: true,
        mobile: { role: "hidden" },
    },
    {
        key: "patient_type",
        label: "TIPO",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Tipo", order: 5 },
        sortable: true,
        render: (value: string | null | undefined) => {
            if (!value) return <span className="text-muted-foreground text-xs">-</span>;
            const types: Record<string, { label: string; className: string }> = {
                T: { label: "Temporal", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400" },
                F: { label: "Final", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400" },
                N: { label: "Neonatal", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400" },
            };
            const t = types[value] || { label: value, className: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400" };
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.className}`}>
                    {t.label}
                </span>
            );
        },
    },
    {
        key: "patientid",
        label: "PATIENT ID",
        className: "font-medium font-mono text-xs",
        hideOnMobile: true,
        mobile: { label: "ID", order: 1 },
        sortable: true,
    },
    {
        key: "username",
        label: "USUARIO",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Usuario", order: 6 },
        sortable: true,
        render: (value: string | null | undefined) => value ?? "-",
    },
    {
        key: "user_status",
        label: "ESTADO USUARIO",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Estado", order: 4 },
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
        mobile: { label: "Género", order: 3 },
        sortable: true,
    },
    {
        key: "birthdate",
        label: "FECHA DE NACIMIENTO",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Nacimiento", order: 5 },
        sortable: true,
        render: (value: string | null | undefined) => value ? formatDate(value) : "-",
    },
    {
        key: "study_count",
        label: "CANTIDAD DE ESTUDIOS",
        className: "font-medium",
        render: (value: number) => value.toString(),
        hideOnMobile: true,
        mobile: { label: "Estudios", order: 6 },
        sortable: true,
    },
];

// Función que genera las acciones con handlers personalizados
export const getPatientActions = (
    onEdit: (patient: Patient) => void,
    onDeactivate: (patient: Patient) => void,
    onActivate: (patient: Patient) => void,
    onViewHistory: (patient: Patient) => void,
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
                    label: "Desactivar",
                    icon: <UserX className="h-4 w-4 text-red-700" />,
                    onClick: onDeactivate,
                    disabled: (patient: Patient) => !patient.username || patient.user_status !== "Active",
                },
                {
                    label: "Activar",
                    icon: <UserCheck className="h-4 w-4 text-green-700" />,
                    onClick: onActivate,
                    disabled: (patient: Patient) => patient.user_status === "Active",
                },
            ]
            : []),
        {
            label: "Historial",
            icon: <History className="h-4 w-4 text-green-700" />,
            onClick: onViewHistory,
            mobilePrimary: true,
            disabled: (patient: Patient) => patient.study_count === 0,
        },
    ];

export { patientColumns };
