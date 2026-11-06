import { ReportButton } from "./columns";
import { useState } from "react";
import type { Study } from "../types";
import { Button } from "@/components/ui/button";
import { Image, Calendar, Clock, Share2, Loader2, Activity } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/fechaYhora";

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
            className="gap-1.5 h-8 text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleViewDicom}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Image className="h-3.5 w-3.5" />}
            Imágenes
        </Button>
    );
};

interface StudyCardProps {
    study: Study;
    onShare: (study: Study) => void;
}

export const StudyCard = ({ study, onShare }: StudyCardProps) => {
    return (
        <div className="min-w-0 rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
            {/* Study type + modality */}
            <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground [overflow-wrap:anywhere]">{study.study_type || "Estudio médico"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Modalidad: {study.modality || "-"}</p>
                </div>
            </div>

            {/* Date + time */}
            <div className="flex flex-wrap items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(study.study_date)}
                </span>
                <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0 ml-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{study.study_time}</span>
            </div>

            <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">N.º acceso: {study.accession_number || "-"}</p>

            {/* Action buttons */}
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 pt-3 border-t border-border [&>button]:w-full">
                <ReportButton study={study} />
                {study.has_images && study.study_uid && <ViewImagesButton study={study} />}
                {study.has_images && study.study_uid && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-600 dark:hover:text-white"
                        onClick={() => onShare(study)}
                    >
                        <Share2 className="h-3.5 w-3.5" />
                        Compartir
                    </Button>
                )}
            </div>
            {(!study.has_images || !study.study_uid) && <p className="text-xs text-muted-foreground">Podrás compartir este estudio cuando las imágenes estén disponibles.</p>}
        </div>
    );
};
