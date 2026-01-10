import type { TableColumn } from "@/types/table";
import type { Study } from "../types";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, Calendar, Clock, User, MapPin } from "lucide-react";

export const studyColumns: TableColumn<Study>[] = [
    {
        key: "accession_number",
        label: "N° ACCESO",
        className: "font-medium text-blue-600",
    },
    {
        key: "study_type",
        label: "TIPO DE ESTUDIO",
        render: (value, row) => (
            <div className="max-w-[200px]">
                <div className="font-medium">{value}</div>
                <div className="text-xs text-gray-500">
                    Modalidad: {row.modality}
                </div>
            </div>
        ),
    },
    {
        key: "study_date",
        label: "FECHA",
        render: (value, row) => (
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                    <div className="text-sm font-medium">
                        {new Date(value).toLocaleDateString("es-AR")}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {row.study_time}
                    </div>
                </div>
            </div>
        ),
        hideOnMobile: true,
    },
    {
        key: "status",
        label: "ESTADO",
        render: (value, row) => {
            const isReported = value === "Reportado";
            return (
                <div className="space-y-1">
                    <Badge
                        variant={isReported ? "default" : "secondary"}
                        className={isReported ? "bg-green-500" : "bg-yellow-500"}
                    >
                        {value}
                    </Badge>
                    {row.report_date && (
                        <div className="text-xs text-gray-500">
                            {new Date(row.report_date).toLocaleDateString("es-AR")}
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        key: "urgency",
        label: "URGENCIA",
        render: (value) => {
            const isUrgent = value === "Urgente";
            return (
                <Badge variant={isUrgent ? "destructive" : "outline"}>
                    {value}
                </Badge>
            );
        },
        hideOnMobile: true,
    },
    {
        key: "referring_physician",
        label: "MÉDICO",
        render: (value) => (
            <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{value}</span>
            </div>
        ),
        hideOnMobile: true,
    },
    {
        key: "location",
        label: "UBICACIÓN",
        render: (value) => (
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{value}</span>
            </div>
        ),
        hideOnMobile: true,
    },
    {
        key: "has_report",
        label: "RECURSOS",
        render: (_, row) => (
            <div className="flex gap-2">
                {row.has_report && (
                    <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        Informe
                    </Badge>
                )}
                {row.has_images && (
                    <Badge variant="outline" className="gap-1">
                        <Image className="h-3 w-3" />
                        Imágenes
                    </Badge>
                )}
            </div>
        ),
    },
];
