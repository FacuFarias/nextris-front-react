import type { TableColumn, TableAction } from "@/types/table";
import type { RequestingPhysician } from "../types/requesting-physicians.types";
import { Edit, Trash2 } from "lucide-react";

export const getRequestingPhysicianColumns = (): TableColumn<RequestingPhysician>[] => [
    {
        key: "description",
        label: "NOMBRE DEL MÉDICO",
        className: "font-medium",
    },
    {
        key: "phone",
        label: "TELÉFONO",
        className: "font-medium",
        render: (value) => value || "-",
    },
    {
        key: "mail",
        label: "EMAIL",
        className: "font-medium",
        render: (value) => value || "-",
    },
    {
        key: "note",
        label: "ESPECIALIDAD/NOTA",
        className: "font-medium",
        render: (value) => value || "-",
    },
    {
        key: "location_name",
        label: "LOCALIZACIÓN",
        className: "font-medium",
        render: (value) => value || "-",
    },
];

export const getRequestingPhysicianActions = (
    onEditar: (physician: RequestingPhysician) => void,
    onEliminar: (physician: RequestingPhysician) => void,
): TableAction<RequestingPhysician>[] => [
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
