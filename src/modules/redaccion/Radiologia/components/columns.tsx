import type { TableAction, TableColumn } from "@/types/table";
import type { Informes } from "../types/informes.types";
import { fechaYhora } from "@/lib/fechaYhora";
import { ClipboardPlus, Image } from "lucide-react";

// Configuración de columnas para usuarios
const informeColumns: TableColumn<Informes>[] = [
    {
        key: "patient_name",
        label: "PACIENTE",
        className: "font-medium",
    },
    {
        key: "patient_dni",
        label: "DNI",
        className: "font-medium",
    },
    {
        key: "study_type",
        label: "EXAMEN",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "status",
        label: "ESTADO",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "admission_number",
        label: "ADM. Nº",
        className: "font-medium",

    },
    {
        key: "accession_number",
        label: "ACC. Nº",
        className: "font-medium",

    },
    {
        key: "created_on",
        label: "FECHA Y HORA DE ADMISION",
        className: "font-medium",
        render: (value: string) => {
            return fechaYhora(value);
        }
    },

];

// Función que genera las acciones con handlers personalizados
export const getInformesActions = (
    onViewInforme: (informe: Informes) => void,
    onViewImagenes: (informe: Informes) => void,
): TableAction<Informes>[] => [
        {
            label: "Redactar Informe",
            icon: <ClipboardPlus className="h-4 w-4 text-blue-900" />,
            onClick: onViewInforme,
        },
        {
            label: "Ver Imágenes",
            icon: <Image className="h-4 w-4 text-green-900" />,
            onClick: onViewImagenes,
            hidden: (informe) => !informe.is_image, // Solo mostrar si is_image es true
        }
    ];

export { informeColumns };
