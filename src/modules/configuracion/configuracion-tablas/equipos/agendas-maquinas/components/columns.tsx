import type { TableColumn, TableAction } from "@/types/table";
import type { EquipmentSchedule } from "../types/equipment-schedules.types";
import { Edit, Trash2 } from "lucide-react";

const equipmentScheduleColumns: TableColumn<EquipmentSchedule>[] = [
    {
        key: "equipment_name",
        label: "MÁQUINA",
        className: "font-medium",
    },
    {
        key: "day",
        label: "DÍA",
        className: "font-medium",
    },
    {
        key: "time_from",
        label: "HORA INICIO",
        className: "font-medium",
        render: (value) => {
            if (!value) return "-";
            // Formatear hora de HH:MM:SS a HH:MM
            const time = value.toString();
            return time.substring(0, 5);
        },
    },
    {
        key: "time_to",
        label: "HORA FIN",
        className: "font-medium",
        render: (value) => {
            if (!value) return "-";
            // Formatear hora de HH:MM:SS a HH:MM
            const time = value.toString();
            return time.substring(0, 5);
        },
    },
];

export const getEquipmentScheduleActions = (
    onEditar: (schedule: EquipmentSchedule) => void,
    onEliminar: (schedule: EquipmentSchedule) => void,
): TableAction<EquipmentSchedule>[] => [
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-blue-900" />,
            onClick: onEditar,
        },
        {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4 text-red-600" />,
            onClick: onEliminar,
        },
    ];

export { equipmentScheduleColumns };
