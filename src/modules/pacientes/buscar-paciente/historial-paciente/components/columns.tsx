import type { TableAction, TableColumn } from "@/types/table";
import { File, Image } from "lucide-react";
import type { HistoryPatient } from "../../types/BuscarPaciente";

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

// Función que genera las acciones con handlers personalizados
export const getHistoryPatientActions = (
    onViewReport: (patient: HistoryPatient) => void,
    onViewImage: (patient: HistoryPatient) => void

): TableAction<HistoryPatient>[] => [
        {
            label: "Ver informe",
            icon: <File className="h-4 w-4 text-brand-purple" />,
            onClick: onViewReport,
        },
        {
            label: "Ver imagen",
            icon: <Image className="h-4 w-4 text-brand-purple" />,
            onClick: onViewImage,
        },
    ];


export { historyColumns };