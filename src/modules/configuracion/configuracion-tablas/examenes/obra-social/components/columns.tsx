import type { TableColumn, TableAction } from "@/types/table";
import { Edit } from "lucide-react";
import type { ObraSocial } from "../types/obra-social.types";

// Configuración de columnas para usuarios
const obraSocialColumns: TableColumn<ObraSocial>[] = [

    {
        key: "description",
        label: "DESCRIPCIÓN",
        className: "font-medium",
    },
    {
        key: "isactive",
        label: "ESTADO",
        className: "font-medium",
        render: (value: number) => value === 1 ? "Activo" : "Inactivo",
    },
    {
        key: "externalcode",
        label: "CÓDIGO EXTERNO",
        className: "font-medium",
    },
    {
        key: "headerdescription",
        label: "DESCRIPCIÓN PARA ENCABEZADOS",
        className: "font-medium",
    }
];

// Función que genera las acciones con handlers personalizados
export const getObraSocialActions = (
    onEditar: (obraSocial: ObraSocial) => void,
): TableAction<ObraSocial>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEditar,
        },
    ];

export { obraSocialColumns };
