import type { TableAction, TableColumn } from "@/types/table";
import { File, Image, Eye, EyeOff, Share2 } from "lucide-react";
import type { HistoryPatient } from "../../types/BuscarPaciente";
import { formatDate } from "@/lib/fechaYhora";

// Configuración de columnas para usuarios
const historyColumns: TableColumn<HistoryPatient>[] = [
    {
        key: "estudio",
        label: "ESTUDIO",
        className: "font-medium",
        sortable: true,
        mobile: { role: "title", order: 1 },
    },
    {
        key: "medico_autor",
        label: "MEDICO AUTOR",
        className: "font-medium",
        sortable: true,
        mobile: { label: "Médico autor", order: 4 },
    },
    {
        key: "medico_referente",
        label: "MEDICO REFERENTE",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { role: "hidden" },
        sortable: true,
    },
    {
        key: "fecha",
        label: "FECHA",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Fecha", order: 2 },
        sortable: true,
        render: (value) => formatDate(value),
    },
    {
        key: "modalidad",
        label: "MODALIDAD",
        className: "font-medium",
        render: (value: number) => value.toString(),
        hideOnMobile: true,
        mobile: { label: "Modalidad", order: 3 },
        sortable: true,
    },
    {
        key: "con_imagen",
        label: "CON IMAGEN",
        className: "font-medium",
        render: (value: string) => value === 'Sí' ? 'Si' : 'No',
        hideOnMobile: true,
        mobile: { label: "Con imagen", order: 5 },
        sortable: true,
    },
];

// Función que genera las acciones con handlers personalizados
export const getHistoryPatientActions = (
    onViewReport: (patient: HistoryPatient) => void,
    onViewImage: (patient: HistoryPatient) => void,
    onToggleVisibility: (patient: HistoryPatient) => void,
    onShareLink: (patient: HistoryPatient) => void

): TableAction<HistoryPatient>[] => [
        {
            label: "Ver informe",
            icon: <File className="h-4 w-4 text-brand-purple" />,
            onClick: onViewReport,
            mobilePrimary: true,
            hidden: (patient) => !patient.report_available,
        },
        {
            label: "Ver imagen",
            icon: <Image className="h-4 w-4 text-brand-purple" />,
            onClick: onViewImage,
            hidden: (patient) => patient.con_imagen !== 'Sí',

        },
        {
            label: "Compartir enlace",
            icon: <Share2 className="h-4 w-4 text-brand-purple" />,
            onClick: onShareLink,
            variant: "secondary",
            hidden: (patient) => !patient.studyinstanceuid,
        },
        {
            label: (patient: HistoryPatient) => patient.hidden_in_portal ? "Mostrar" : "Ocultar",
            icon: (patient: HistoryPatient) =>
                patient.hidden_in_portal
                    ? <Eye className="h-4 w-4 text-green-600" />
                    : <EyeOff className="h-4 w-4 text-orange-500" />,
            onClick: onToggleVisibility,
        },
    ];


export { historyColumns };
