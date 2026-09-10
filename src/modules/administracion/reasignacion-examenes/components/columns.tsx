import type { TableColumn } from "@/types/table";
import type { ReasignacionExamenes } from "../types/reasignacion-examenes.type";
import { formatDate } from "@/lib/fechaYhora";


// Configuración de columnas para usuarios
const reasignacionColumns: TableColumn<ReasignacionExamenes>[] = [
    {
        key: "createdon",
        label: "Fecha del estudio",
        className: "font-medium",
        render: (date) => formatDate(date),
    },
    {
        key: "localacc",
        label: "Accession number",
        className: "font-medium",
    },
    {
        key: "patientid",
        label: "ID del paciente",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "patient_name",
        label: "Nombre del paciente",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "study_description",
        label: "Descripción del estudio",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "status",
        label: "Estado",
        className: "font-medium",
        hideOnMobile: true,
    },
];

// Función que genera las acciones con handlers personalizados
/* export const getPatientActions = (
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
    ]; */

export { reasignacionColumns };
