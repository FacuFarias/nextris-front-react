import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";
import type { TableColumn } from "@/types/table";
import { formatDate } from "@/lib/fechaYhora";


// Configuración de columnas para usuarios
const admisionColumns: TableColumn<Patient>[] = [
    {
        key: "name",
        label: "NOMBRE",
        className: "font-medium",
        mobile: { role: "title", order: 1 },
    },
    {
        key: "surname",
        label: "APELLIDO",
        className: "font-medium",
        mobile: { label: "Apellido", order: 2 },
    },
    {
        key: "gender",
        label: "GENERO",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Género", order: 4 },
    },
    {
        key: "birthdate",
        label: "FECHA DE NACIMIENTO",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { role: "hidden" },
        render: (value) => formatDate(value),
    },
    {
        key: "nationalcode",
        label: "DNI",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "DNI", order: 3 },
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

export { admisionColumns };
