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
        render: (value: string) => {
            return fechaYhora(value);
        }
    },
    {
        key: "patient_surname",
        label: "APELLIDO",
        className: "font-medium",
    },
    {
        key: "patient_name",
        label: "NOMBRE",
        className: "font-medium",
    },
    {
        key: "study_type",
        label: "TIPO DE ESTUDIO",
        className: "font-medium",
    },
    {
        key: "status",
        label: "ESTADO",
        className: "font-medium",
        hideOnMobile: true,
    },
    {
        key: "equipment",
        label: "MÁQUINA",
        className: "font-medium",
    },
    {
        key: "admission_number",
        label: "ADM. Nº",
        className: "font-medium",
    },
    {
        key: "accession_number",
        label: "ACC. Nº",
        className: "font-medium",
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
        },

    ];



export { ejecucionColumns };
