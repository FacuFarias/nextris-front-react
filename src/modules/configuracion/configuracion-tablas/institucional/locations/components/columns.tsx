import type { TableAction, TableColumn } from "@/types/table";
import type { Location } from "../types/locations.types";
import { Check, Edit, X } from "lucide-react";

const isInactiveLocation = (location: Location): boolean =>
    String(location.status || "").trim().toLowerCase() === "inactive";

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
    {
        key: "status",
        label: "ESTADO",
        className: "font-medium",
        render: (value) => {
            const isInactive = String(value || "").trim().toLowerCase() === "inactive";
            return isInactive ? "Inactiva" : "Activa";
        },
    },
];

// Función que genera las acciones con handlers personalizados
export const getLocationActions = (
    onEdit: (location: Location) => void,
    onActivate: (location: Location) => void,
    onDeactivate: (location: Location) => void,
): TableAction<Location>[] => [
        {
            label: "editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEdit,
        },
        {
            label: "activar",
            icon: <Check className="h-4 w-4 text-green-700" />,
            onClick: onActivate,
            hidden: (row) => !isInactiveLocation(row),
        },
        {
            label: "desactivar",
            icon: <X className="h-4 w-4 text-red-700" />,
            onClick: onDeactivate,
            hidden: (row) => isInactiveLocation(row),
        },

    ];



export { locationColumns };
