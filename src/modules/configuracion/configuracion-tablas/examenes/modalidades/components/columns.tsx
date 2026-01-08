import type { TableColumn } from "@/types/table";
import type { Modalidad } from "../types/modalidades.types";

// Configuración de columnas para usuarios
const modalidadColumns: TableColumn<Modalidad>[] = [
    {
        key: "guid",
        label: "GUID",
        className: "font-medium",
    },
    {
        key: "description",
        label: "DESCRIPCIÓN",
        className: "font-medium",
    },

];

// Función que genera las acciones con handlers personalizados
/* export const getFacilityActions = (
    onVerDetalle: (facilities: Facility) => void,
): TableAction<Facility>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onVerDetalle,
        },

    ]; */



export { modalidadColumns };
