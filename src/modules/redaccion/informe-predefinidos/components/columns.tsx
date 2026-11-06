import type { TableColumn, TableAction } from "@/types/table";
import type { Template } from "../types/informe-pred.types";
import { Eye, Edit, Trash2, FileCheck } from "lucide-react";

/**
 * Configuración de columnas para la tabla de plantillas
 */
export const templateColumns: TableColumn<Template>[] = [
    {
        key: "title",
        label: "TÍTULO",
        className: "font-medium",
        sortable: true,
    },
    {
        key: "study_type_description",
        label: "TIPO DE ESTUDIO",
        className: "font-medium",
        sortable: true,
    },
    {
        key: "study_reason",
        label: "RAZÓN DEL ESTUDIO",
        className: "max-w-xs truncate",
        hideOnMobile: true,
        render: (value: string) => value || "Sin razón",
    },
    {
        key: "content",
        label: "CONTENIDO",
        className: "max-w-xs truncate",
        hideOnMobile: true,
        render: (value: string) => value || "Sin contenido",
    },
];

/**
 * Función que genera las acciones con handlers personalizados
 */
export const getTemplateActions = (
    onView: (template: Template) => void,
    onSelect: (template: Template) => void,
    onEdit: (template: Template) => void,
    onDelete: (template: Template) => void
): TableAction<Template>[] => [
        {
            label: "Ver",
            icon: <Eye className="h-4 w-4 text-blue-600" />,
            onClick: onView,
        },
        {
            label: "Seleccionar",
            icon: <FileCheck className="h-4 w-4 text-green-600" />,
            onClick: onSelect,
        },
        {
            label: "Editar",
            icon: <Edit className="h-4 w-4 text-brand-purple" />,
            onClick: onEdit,
        },
        {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4 text-red-600" />,
            onClick: onDelete,
        },
    ];
