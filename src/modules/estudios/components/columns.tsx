import { useState } from "react";
import type { TableColumn } from "@/types/table";
import type { Study } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image, Calendar, Clock, User, MapPin, Share2, Loader2 } from "lucide-react";
import { estudiosService } from "../services/estudios.service";

const ReportButton = ({ study }: { study: Study }) => {
    const [loading, setLoading] = useState(false);

    const handleOpen = async () => {
        setLoading(true);
        try {
            await estudiosService.openReport(study.examination_id);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleOpen}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <FileText className="h-3 w-3" />
            )}
            Informe
        </Button>
    );
};

export const createStudyColumns = (onShare: (study: Study) => void): TableColumn<Study>[] => [
    {
        key: "accession_number",
        label: "N° ACCESO",
        className: "font-medium text-blue-600 dark:text-blue-400",
    },
    {
        key: "study_type",
        label: "TIPO DE ESTUDIO",
        render: (value, row) => (
            <div className="max-w-[200px]">
                <div className="font-medium">{value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <div>
                    <div className="text-sm font-medium">
                        {new Date(value).toLocaleDateString("es-AR")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {row.study_time}
                    </div>
                </div>
            </div>
        ),
        hideOnMobile: true,
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
                <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
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
                <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm">{value}</span>
            </div>
        ),
        hideOnMobile: true,
    },
    {
        key: "has_report",
        label: "RECURSOS",
        render: (_, row) => (
            <div className="flex flex-wrap gap-2 items-center">
                {row.has_report && <ReportButton study={row} />}
                {row.has_images && row.study_uid && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-7 text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={() =>
                            window.open(
                                `https://viewer.nextris.cloud/viewer?StudyInstanceUIDs=${row.study_uid}`,
                                "_blank"
                            )
                        }
                    >
                        <Image className="h-3 w-3" />
                        Imágenes
                    </Button>
                )}
                {row.has_report && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-7 text-xs border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white"
                        onClick={() => onShare(row)}
                    >
                        <Share2 className="h-3 w-3" />
                        Compartir
                    </Button>
                )}
            </div>
        ),
    },
];
