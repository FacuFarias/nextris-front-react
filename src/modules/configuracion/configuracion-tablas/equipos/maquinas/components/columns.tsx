import type { TableColumn, TableAction } from "@/types/table";
import type { Equipment } from "../types/equipment.types";
import { Edit } from "lucide-react";

const equipmentColumns: TableColumn<Equipment>[] = [
    {
        key: "description",
        label: "DESCRIPCIÓN",
        className: "font-medium",
    },
    {
        key: "modality_name",
        label: "MODALIDAD",
        className: "font-medium",
    },
    {
        key: "location_name",
        label: "UBICACIÓN",
        className: "font-medium",
    },
    {
        key: "aetitle",
        label: "AE TITLE",
        className: "font-medium",
    },
    {
        key: "ip",
        label: "IP",
        className: "font-medium",
    },
    {
        key: "port",
        label: "PUERTO",
        className: "font-medium",
    },
    {
        key: "status",
        label: "ESTADO",
        className: "font-medium",
        render: (value) => (
            <span className={`px-2 py-1 rounded-full text-xs ${value === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                {value === 'active' ? 'Activo' : 'Inactivo'}
            </span>
        ),
    },
];

export const getEquipmentActions = (
    onEditar: (equipment: Equipment) => void,
): TableAction<Equipment>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEditar,
        },
    ];

export { equipmentColumns };
