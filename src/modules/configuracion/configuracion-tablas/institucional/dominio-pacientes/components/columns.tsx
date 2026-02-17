import type { TableColumn, TableAction } from "@/types/table";
import { Edit } from "lucide-react";
import type { DominioPaciente } from "../types/dominio-pacientes.types";

const dominioPacienteColumns: TableColumn<DominioPaciente>[] = [
    {
        key: "description",
        label: "DESCRIPCION",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
    {
        key: "isactive",
        label: "ESTADO",
        className: "font-medium",
        sortable: true,
        render: (value: number) => (value === 1 ? "Activo" : "Inactivo"),
    },
    {
        key: "externalcode",
        label: "CODIGO EXTERNO",
        className: "font-medium",
        sortable: true,
        filterable: true,
    },
];

export const getDominioPacienteActions = (
    onEditar: (item: DominioPaciente) => void,
): TableAction<DominioPaciente>[] => [
    {
        label: "Editar",
        icon: <Edit className="h-4 w-4 text-blue-900" />,
        onClick: onEditar,
    },
];

export { dominioPacienteColumns };
