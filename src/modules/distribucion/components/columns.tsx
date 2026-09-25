import type { TableColumn } from "@/types/table";
import type { Examen } from "../types/distribucion.types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/fechaYhora";
import { formatPatientName } from "@/lib/formatPatientName";

export const distribucionColumns: TableColumn<Examen>[] = [
    {
        key: "fecha",
        label: "FECHA",
        className: "font-medium",
        sortable: true,
        mobile: { label: "Fecha", order: 3 },
        render: (value) => formatDate(value),
    },
    {
        key: "paciente",
        label: "PACIENTE",
        className: "font-medium",
        sortable: true,
        mobile: { role: "title", order: 1 },
        render: (value) => formatPatientName(value),
    },
    {
        key: "examen",
        label: "EXAMEN",
        className: "font-medium",
        sortable: true,
        mobile: { label: "Examen", order: 2 },
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
        sortable: true,
        mobile: { role: "hidden" },
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
        sortable: true,
        mobile: { label: "Médico autor", order: 5 },
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
        sortable: true,
        mobile: { label: "Email", order: 4 },
    },
    {
        key: "accession_number",
        label: "ACC. Nº",
        className: "font-medium text-sm",
        sortable: true,
        mobile: { role: "hidden" },
    },
    {
        key: "urgencia",
        label: "URGENCIA",
        className: "font-medium text-center",
        sortable: true,
        mobile: { label: "Urgencia", order: 6 },
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
        sortable: true,
        mobile: { label: "Estado", order: 7 },
        render: (_value, row) => {
            if (row.estado === "E") {
                const tooltip = row.send_error
                    ? `Enviado: ${row.sent_at}\nError: ${row.send_error}`
                    : `Enviado: ${row.sent_at}`;
                return (
                    <div className="flex justify-center">
                        <Badge
                            className="bg-green-500 hover:bg-green-600 cursor-help"
                            title={tooltip}
                        >
                            ENVIADO
                        </Badge>
                    </div>
                );
            }
            return (
                <div className="flex justify-center">
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">PENDIENTE</Badge>
                </div>
            );
        },
    },
];
