import type { TableColumn, TableAction } from "@/types/table";
import type { TipoEstudio } from "../types/tipos-estudio.types";
import { Edit } from "lucide-react";

const tipoEstudioColumns: TableColumn<TipoEstudio>[] = [
    {
        key: "code",
        label: "CÓDIGO",
        className: "font-medium",
        headerClassName: "w-[60px]",
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
        headerClassName: "w-[150px]",
    },
    {
        key: "bodypart",
        label: "PARTE DEL CUERPO",
        className: "font-medium",
        headerClassName: "w-[160px]",
    },
    {
        key: "modality",
        label: "MOD",
        className: "font-medium",
        headerClassName: "w-[55px]",
    },
];

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
