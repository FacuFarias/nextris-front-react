import type { TableColumn, TableAction } from "@/types/table";
import { Edit } from "lucide-react";
import type { GruposEstudio } from "../types/grupos-estudio.types";

// Configuración de columnas para usuarios
const gruposEstudioColumns: TableColumn<GruposEstudio>[] = [

    {
        key: "description",
        label: "DESCRIPCIÓN",
        className: "font-medium",
    },

];

// Función que genera las acciones con handlers personalizados
export const getGruposEstudioActions = (
    onEditar: (grupoEstudio: GruposEstudio) => void,
): TableAction<GruposEstudio>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEditar,
        },
    ];

export { gruposEstudioColumns };
