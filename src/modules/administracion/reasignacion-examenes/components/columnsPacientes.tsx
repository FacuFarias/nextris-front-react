import type { TableColumn } from "@/types/table";
import type { ReasignacionExamenesPacientes } from "../types/reasignacion-examenes.type";


// Configuración de columnas para usuarios
const pacienteEstudioColumns: TableColumn<ReasignacionExamenesPacientes>[] = [
    {
        key: "name",
        label: "Nombre del paciente",
        className: "font-medium",
    },
    {
        key: "surname",
        label: "Apellido",
        className: "font-medium",
    },
    {
        key: "nationalcode",
        label: "DNI",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "gender",
        label: "Sexo",
        className: "font-medium",
        hideOnMobile: true,
        render: (gender) => gender === 'M' ? 'Masculino ' : 'Femenino',
    },
    {
        key: "birthdate",
        label: "Fecha de nacimiento",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "phone",
        label: "Teléfono",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "email",
        label: "Email",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "healthcard",
        label: "Tarjeta sanitaria",
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

export { pacienteEstudioColumns };
