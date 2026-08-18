import { useState } from "react";
import type { TableColumn } from "@/types/table";
import type { Study } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image, Calendar, Clock, User, Share2, Loader2, Stethoscope } from "lucide-react";
import { estudiosService } from "../services/estudios.service";
import { toast } from "sonner";

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

const ViewImagesButton = ({ study }: { study: Study }) => {
    const [loading, setLoading] = useState(false);

    const handleViewDicom = () => {
        if (!study.study_uid) {
            toast.error("El estudio no tiene Study Instance UID");
            return;
        }

        setLoading(true);

        const authDataRaw = localStorage.getItem("authData");
        const token = authDataRaw ? JSON.parse(authDataRaw).access_token : null;

        fetch("/api/general/viewer-url-by-iuid", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ study_iuid: study.study_uid }),
        })
            .then((res) => res.json())
            .then((data) => {
                setLoading(false);
                if (data.success && data.data?.viewer_url) {
                    window.open(data.data.viewer_url, "_blank");
                } else {
                    toast.error(data.message || "No se pudo obtener la URL del visor");
                }
            })
            .catch(() => {
                setLoading(false);
                toast.error("No se pudo abrir el visor DICOM");
            });
    };

    return (
        <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleViewDicom}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <Image className="h-3 w-3" />
            )}
            Imágenes
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
                        {value ? value.split("-").reverse().join("/") : ""}
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
        key: "requesting_physician",
        label: "MÉDICO SOLICITANTE",
        render: (value) => (
            <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm">{value || "-"}</span>
            </div>
        ),
        hideOnMobile: true,
    },
    {
        key: "author_physician",
        label: "MÉDICO AUTOR",
        render: (value) => (
            <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm">{value || "-"}</span>
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
                {row.has_images && row.study_uid && <ViewImagesButton study={row} />}
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
