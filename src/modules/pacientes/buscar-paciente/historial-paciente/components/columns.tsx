import type { TableAction, TableColumn } from "@/types/table";
import type { HistoryPatient } from "../../../types/BuscarPaciente";
import { File, Image } from "lucide-react";

// Configuración de columnas para usuarios
const historyColumns: TableColumn<HistoryPatient>[] = [
    {
        key: "estudio",
        label: "ESTUDIO",
        className: "font-medium",
        sortable: true,
    },
    {
        key: "medico_autor",
        label: "MEDICO AUTOR",
        className: "font-medium",
        sortable: true,
    },
    {
        key: "medico_referente",
        label: "MEDICO REFERENTE",
        className: "font-medium",
        hideOnMobile: true,
        sortable: true,
    },
    {
        key: "fecha",
        label: "FECHA",
        className: "font-medium",
        hideOnMobile: true,
        sortable: true,
    },
    {
        key: "modalidad",
        label: "MODALIDAD",
        className: "font-medium",
        render: (value: number) => value.toString(),
        hideOnMobile: true,
        sortable: true,
    },
    {
        key: "con_imagen",
        label: "CON IMAGEN",
        className: "font-medium",
        render: (value: number) => value.toString(),
        hideOnMobile: true,
        sortable: true,
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