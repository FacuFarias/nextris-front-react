import type { TableAction, TableColumn } from "@/types/table";
import type { Facility } from "../types/facilities.types";
import { Check, Edit, Settings2, X } from "lucide-react";

const isInactiveFacility = (facility: Facility): boolean =>
    String(facility.status || "").trim().toLowerCase() === "inactive";

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
        key: "plan.code",
        label: "PLAN",
        className: "font-medium",
        render: (value) => (value ? String(value).toUpperCase() : "-"),
    },
    {
        key: "usage_monthly.received_count",
        label: "RECIBIDOS MES",
        className: "font-medium",
        render: (value, row) => {
            const current = Number(value || 0);
            const limit = row.plan?.max_receive_monthly;
            return limit == null ? `${current} / ilimitado` : `${current} / ${limit}`;
        },
    },
    {
        key: "usage_monthly.distributed_count",
        label: "DISTRIBUIDOS MES",
        className: "font-medium",
        render: (value, row) => {
            const current = Number(value || 0);
            const limit = row.plan?.max_distribute_monthly;
            return limit == null ? `${current} / ilimitado` : `${current} / ${limit}`;
        },
    },
    {
        key: "status",
        label: "ESTADO",
        className: "font-medium",
        render: (value) => String(value || "").trim().toLowerCase() === "inactive" ? "Inactiva" : "Activa",
    }
];

// Función que genera las acciones con handlers personalizados
export const getFacilityActions = (
    onVerDetalle: (facilities: Facility) => void,
    onGestionPlan: (facilities: Facility) => void,
    onActivate: (facilities: Facility) => void,
    onDeactivate: (facilities: Facility) => void,
): TableAction<Facility>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onVerDetalle,
        },
        {
            label: "Gestión del Plan",
            icon: <Settings2 className="h-4 w-4 text-blue-900" />,
            onClick: onGestionPlan,
        },
        {
            label: "Activar",
            icon: <Check className="h-4 w-4 text-green-700" />,
            onClick: onActivate,
            hidden: (row) => !isInactiveFacility(row),
        },
        {
            label: "Desactivar",
            icon: <X className="h-4 w-4 text-red-700" />,
            onClick: onDeactivate,
            hidden: (row) => isInactiveFacility(row),
        },

    ];



export { facilityColumns };
