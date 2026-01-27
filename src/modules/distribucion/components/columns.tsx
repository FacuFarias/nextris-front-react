import type { TableColumn } from "@/types/table";
import type { Examen } from "../types/distribucion.types";
import { Badge } from "@/components/ui/badge";

export const distribucionColumns: TableColumn<Examen>[] = [
    {
        key: "fecha",
        label: "FECHA",
        className: "font-medium",
    },
    {
        key: "paciente",
        label: "PACIENTE",
        className: "font-medium",
    },
    {
        key: "examen",
        label: "EXAMEN",
        className: "font-medium",
        render: (value) => (
            <div className="max-w-[150px] truncate" title={value}>
                {value}
            </div>
        ),
    },
    {
        key: "medico_solicitante",
        label: "MÉDICO SOLICITANTE",
        className: "font-medium text-sm",
        render: (value) => (
            <div className="max-w-[150px] truncate" title={value}>
                {value}
            </div>
        ),
    },
    {
        key: "medico_autor",
        label: "MÉDICO AUTOR",
        className: "font-medium text-sm",
        render: (value) => (
            <div className="max-w-[150px] truncate" title={value}>
                {value}
            </div>
        ),
    },
    {
        key: "mail",
        label: "EMAIL",
        className: "font-medium text-sm",
    },
    {
        key: "accession_number",
        label: "ACC. Nº",
        className: "font-medium text-sm",
    },
    {
        key: "urgencia",
        label: "URGENCIA",
        className: "font-medium text-center",
        render: (value) => (
            <div className="flex justify-center">
                {value === "S" ? (
                    <Badge variant="destructive">URGENTE</Badge>
                ) : (
                    <Badge variant="outline">NORMAL</Badge>
                )}
            </div>
        ),
    },
    {
        key: "estado",
        label: "ESTADO",
        className: "font-medium text-center",
        render: (value) => (
            <div className="flex justify-center">
                {value === "E" ? (
                    <Badge className="bg-green-500 hover:bg-green-600">ENVIADO</Badge>
                ) : (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">PENDIENTE</Badge>
                )}
            </div>
        ),
    },
];
