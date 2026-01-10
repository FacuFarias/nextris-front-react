import type { TableColumn, TableAction } from "@/types/table";
import type { Modalidad } from "../types/modalidades.types";
import { Edit } from "lucide-react";

// Configuración de columnas para usuarios
const modalidadColumns: TableColumn<Modalidad>[] = [
    {
        key: "externalcode",
        label: "CÓDIGO",
        className: "font-medium",
    },
    {
        key: "description",
        label: "DESCRIPCIÓN",
        className: "font-medium",
    },

];

// Función que genera las acciones con handlers personalizados
export const getModalidadActions = (
    onEditar: (modalidad: Modalidad) => void,
): TableAction<Modalidad>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEditar,
        },
    ];

export { modalidadColumns };
