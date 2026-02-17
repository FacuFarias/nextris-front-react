import type { TableColumn, TableAction } from "@/types/table";
import { Edit, MapPin } from "lucide-react";
import type { ObraSocial } from "../types/obras-sociales.types";

const obraSocialColumns: TableColumn<ObraSocial>[] = [
    {
        key: "description",
        label: "DESCRIPCION",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
    {
        key: "isactive",
        label: "ESTADO",
        className: "font-medium",
        sortable: true,
        render: (value: number) => value === 1 ? "Activo" : "Inactivo",
    },
    {
        key: "externalcode",
        label: "CODIGO EXTERNO",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
    {
        key: "headerdescription",
        label: "DESCRIPCION PARA ENCABEZADOS",
        className: "font-medium",
    },
];

export const getObraSocialActions = (
    onEditar: (obraSocial: ObraSocial) => void,
    onLocations: (obraSocial: ObraSocial) => void,
): TableAction<ObraSocial>[] => [
    {
        label: "Editar",
        icon: <Edit className="h-4 w-4 text-blue-900" />,
        onClick: onEditar,
    },
    {
        label: "Ubicaciones",
        icon: <MapPin className="h-4 w-4 text-green-700" />,
        onClick: onLocations,
    },
];

export { obraSocialColumns };
