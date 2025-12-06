import type { TableColumn } from "@/types/table";
import type { HistoryPatient } from "../../../types/BuscarPaciente";

// Configuración de columnas para usuarios
const historyColumns: TableColumn<HistoryPatient>[] = [
    {
        key: "estudio",
        label: "ESTUDIO",
        className: "font-medium",
    },
    {
        key: "medico_autor",
        label: "MEDICO AUTOR",
        className: "font-medium",
    },
    {
        key: "medico_referente",
        label: "MEDICO REFERENTE",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "fecha",
        label: "FECHA",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "modalidad",
        label: "MODALIDAD",
        className: "font-medium",
        render: (value: number) => value.toString(),
        hideOnMobile: true,
    },
    {
        key: "con_imagen",
        label: "CON IMAGEN",
        className: "font-medium",
        render: (value: number) => value.toString(),
        hideOnMobile: true,
    },
];

/* // Función que genera las acciones con handlers personalizados
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
        },
    ];

 */
export { historyColumns }