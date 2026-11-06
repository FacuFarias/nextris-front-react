import type { TableColumn, TableAction } from "@/types/table";
import type { PhysicianSchedule } from "../types/physician-schedules.types";
import { Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/fechaYhora";

export const getPhysicianScheduleColumns = (): TableColumn<PhysicianSchedule>[] => [
    {
        key: "physician_name",
        label: "MÉDICO",
        className: "font-medium",
    },
    {
        key: "day",
        label: "DÍA",
        className: "font-medium",
    },
    {
        key: "time_from",
        label: "HORA DESDE",
        className: "font-medium",
        render: (value) => {
            if (!value) return "-";
            // Formato HH:MM
            const timeStr = value.toString();
            return timeStr.substring(0, 5);
        },
    },
    {
        key: "time_to",
        label: "HORA HASTA",
        className: "font-medium",
        render: (value) => {
            if (!value) return "-";
            // Formato HH:MM
            const timeStr = value.toString();
            return timeStr.substring(0, 5);
        },
    },
    {
        key: "init_day",
        label: "FECHA INICIO",
        className: "font-medium",
        render: (value) => {
            if (!value) return "-";
            return formatDate(value.toString());
        },
    },
    {
        key: "finish_day",
        label: "FECHA FIN",
        className: "font-medium",
        render: (value) => {
            if (!value) return "-";
            return formatDate(value.toString());
        },
    },
    {
        key: "location_name",
        label: "LOCALIZACIÓN",
        className: "font-medium",
        render: (value) => value || "-",
    },
];

export const getPhysicianScheduleActions = (
    onEditar: (schedule: PhysicianSchedule) => void,
    onEliminar: (schedule: PhysicianSchedule) => void,
): TableAction<PhysicianSchedule>[] => [
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
