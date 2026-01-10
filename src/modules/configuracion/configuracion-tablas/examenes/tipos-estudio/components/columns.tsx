import type { TableColumn, TableAction } from "@/types/table";
import type { TipoEstudio } from "../types/tipos-estudio.types";
import { Edit } from "lucide-react";

// Configuración de columnas para usuarios
const tipoEstudioColumns: TableColumn<TipoEstudio>[] = [
    {
        key: "code",
        label: "CÓDIGO",
        className: "font-medium",
    },
    {
        key: "description",
        label: "DESCRIPCIÓN",
        className: "font-medium",
    },
    {
        key: "studygroup",
        label: "GRUPO DE ESTUDIO",
        className: "font-medium",
    },
    {
        key: "bodypart",
        label: "PARTE DEL CUERPO",
        className: "font-medium",
    },
    {
        key: "modality",
        label: "MODALIDAD",
        className: "font-medium",
    },
    {
        key: "rvu",
        label: "RVU",
        className: "font-medium",
    },
    {
        key: "nofviews",
        label: "NÚMERO DE VISTAS",
        className: "font-medium",
        render: (value) => Math.round(value)

    },
];

// Función que genera las acciones con handlers personalizados
export const getTipoEstudioActions = (
    onEditar: (tipoEstudio: TipoEstudio) => void,
): TableAction<TipoEstudio>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEditar,
        },
    ];

export { tipoEstudioColumns };
