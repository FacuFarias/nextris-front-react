import type { TableAction, TableColumn } from "@/types/table";
import type { Facility } from "../types/facilities.types";
import { Edit } from "lucide-react";

// Configuración de columnas para usuarios
const facilityColumns: TableColumn<Facility>[] = [
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
        key: "email",
        label: "EMAIL",
        className: "font-medium",
    },
    {
        key: "contact_person",
        label: "PERSONA DE CONTACTO",
        className: "font-medium",
    },
    {
        key: "patientdomain_name",
        label: "DOMINIO PACIENTES",
        className: "font-medium",
        render: (value) => value || "-",
    },
    {
        key: "status",
        label: "ESTADO",
        className: "font-medium",
    }
];

// Función que genera las acciones con handlers personalizados
export const getFacilityActions = (
    onVerDetalle: (facilities: Facility) => void,
): TableAction<Facility>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onVerDetalle,
        },

    ];



export { facilityColumns };
