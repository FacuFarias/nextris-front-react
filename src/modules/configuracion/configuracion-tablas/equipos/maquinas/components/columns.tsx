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
        key: "modality",
        label: "MODALIDAD",
        className: "font-medium",
    },
    {
        key: "location_name",
        label: "UBICACIÓN",
        className: "font-medium",
    },
    {
        key: "aeTitle",
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
