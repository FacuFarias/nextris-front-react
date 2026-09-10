import { useState, type ReactNode } from "react";
import type { TableColumn } from "@/types/table";
import { formatDate } from "@/lib/fechaYhora";
import type { Study } from "../types";
import { Button } from "@/components/ui/button";
import { FileText, Image, Calendar, Clock, Share2, Loader2, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

    const button = (
        <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleOpen}
            disabled={!study.has_report || loading}
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
            Reporte
        </Button>
    );

    return study.has_report ? button : (
        <UnavailableReportAction>{button}</UnavailableReportAction>
    );
};

const UnavailableReportAction = ({ children }: { children: ReactNode }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex">{children}</span>
            </TooltipTrigger>
            <TooltipContent>El informe no está disponible</TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const DownloadImagesButton = ({ study }: { study: Study }) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            await estudiosService.downloadImages(study.examination_id);
        } finally {
            setLoading(false);
        }
    };

    const button = (
        <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleDownload}
            disabled={!study.has_images || !study.study_uid || loading}
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Descargar
        </Button>
    );

    return study.has_images && study.study_uid ? button : (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex">{button}</span>
                </TooltipTrigger>
                <TooltipContent>No hay imágenes disponibles</TooltipContent>
            </Tooltip>
        </TooltipProvider>
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

    const button = (
        <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleViewDicom}
            disabled={!study.has_images || !study.study_uid || loading}
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Image className="h-3 w-3" />}
            Imágenes
        </Button>
    );

    return study.has_images && study.study_uid ? button : (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex">{button}</span>
                </TooltipTrigger>
                <TooltipContent>No hay imágenes disponibles</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export const createStudyColumns = (onShare: (study: Study) => void): TableColumn<Study>[] => [
    {
        key: "study_date",
        label: "FECHA",
        render: (value, row) => (
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <div>
                    <div className="font-medium">
                        {formatDate(value)}
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
        key: "has_report",
        label: "RECURSOS",
        render: (_, row) => {
            const shareButton = (
                <Button
                    size="sm"
                    variant="outline"
                    disabled={!row.study_uid}
                    className="gap-1 h-7 text-xs border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white"
                    onClick={() => onShare(row)}
                >
                    <Share2 className="h-3 w-3" />
                    Compartir
                </Button>
            );

            return (
                <div className="flex flex-wrap gap-2 items-center">
                    <ViewImagesButton study={row} />
                    <ReportButton study={row} />
                    {row.study_uid ? shareButton : (
                        <UnavailableReportAction>{shareButton}</UnavailableReportAction>
                    )}
                    <DownloadImagesButton study={row} />
                </div>
            );
        },
    },
];
