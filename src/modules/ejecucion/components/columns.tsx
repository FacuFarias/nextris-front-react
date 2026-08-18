import type { TableAction, TableColumn } from "@/types/table";
import type { Ejecucion } from "../types/ejecucion.type";
import { Eye } from "lucide-react";
import { fechaYhora } from "@/lib/fechaYhora";

// Configuración de columnas para usuarios
const ejecucionColumns: TableColumn<Ejecucion>[] = [
    {
        key: "created_on",
        label: "FECHA y HORA",
        className: "font-medium",
        sortable: true,
        filterable: true,
        render: (value: string) => {
            return fechaYhora(value);
        },
        mobile: { label: "Fecha y hora", order: 4 },
    },
    {
        key: "patient_surname",
        label: "APELLIDO",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { role: "title", label: "Paciente", order: 1 },
    },
    {
        key: "patient_name",
        label: "NOMBRE",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { label: "Nombre", order: 2 },
    },
    {
        key: "study_type",
        label: "TIPO DE ESTUDIO",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { label: "Estudio", order: 3 },
    },
    {
        key: "status",
        label: "ESTADO",
        className: "font-medium",
        hideOnMobile: true,
        mobile: { label: "Estado", order: 5 },
        sortable: true,
        filterable: true,
    },
    {
        key: "equipment",
        label: "MÁQUINA",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { role: "hidden" },
    },
    {
        key: "admission_number",
        label: "ADM. Nº",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { role: "hidden" },
    },
    {
        key: "accession_number",
        label: "ACC. Nº",
        className: "font-medium",
        sortable: true,
        filterable: true,
        mobile: { label: "Acceso", order: 6 },
    }
];

// Función que genera las acciones con handlers personalizados
export const getEjecucionActions = (
    onVerDetalle: (patient: Ejecucion) => void,
): TableAction<Ejecucion>[] => [
        {
            label: "Ver Detalle",
            icon: <Eye className="h-4 w-4 text-blue-900" />,
            onClick: onVerDetalle,
            mobilePrimary: true,
        },

    ];



export { ejecucionColumns };
