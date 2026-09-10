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
        <div className="bg-white dark:bg-[#1a1b24] rounded-lg border dark:border-[rgba(255,255,255,0.07)] p-4 space-y-3 shadow-sm">
            {/* Patient information */}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {study.patient_name || "-"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Patient ID: {study.patient_id || "-"}
                </p>
            </div>

            {/* Study type + modality */}
            <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{study.study_type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Modalidad: {study.modality}</p>
                </div>
            </div>

            {/* Date + time */}
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(study.study_date)}
                </span>
                <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0 ml-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{study.study_time}</span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full shrink-0 ${study.status === "Reportado" ? "bg-green-500" : "bg-yellow-500"}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{study.status}</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1 border-t dark:border-gray-700">
                {study.has_images && study.study_uid && <ViewImagesButton study={study} />}
                {study.has_report && (
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
        </div>
    );
};
