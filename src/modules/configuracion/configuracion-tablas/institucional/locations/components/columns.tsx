import type { TableColumn } from "@/types/table";
import type { Location } from "../types/locations.types";

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
];

// Función que genera las acciones con handlers personalizados
/* export const getEjecucionActions = (
    onVerDetalle: (patient: Ejecucion) => void,
): TableAction<Ejecucion>[] => [
        {
            label: "Ver Detalle",
            icon: <Eye className="h-4 w-4 text-blue-900" />,
            onClick: onVerDetalle,
        },

    ];
 */


export { locationColumns };
