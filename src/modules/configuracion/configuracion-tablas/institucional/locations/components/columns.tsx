import type { TableAction, TableColumn } from "@/types/table";
import type { Location } from "../types/locations.types";
import { Edit } from "lucide-react";

// Configuración de columnas para usuarios
const locationColumns: TableColumn<Location>[] = [
    {
        key: "name",
        label: "NOMBRE",
        className: "font-medium",
    },
    {
        key: "code",
        label: "CÓDIGO",
        className: "font-medium",
    },
    {
        key: "facility_name",
        label: "INSTITUCIÓN",
        className: "font-medium",
    },

    {
        key: "email",
        label: "EMAIL",
        className: "font-medium",
    },
    {
        key: "address",
        label: "DIRECCIÓN",
        className: "font-medium",
    },
    {
        key: "phone",
        label: "TELÉFONO",
        className: "font-medium",
    },
];

// Función que genera las acciones con handlers personalizados
export const getLocationActions = (
    onEdit: (location: Location) => void,
): TableAction<Location>[] => [
        {
            label: "editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEdit,
        },

    ];



export { locationColumns };
