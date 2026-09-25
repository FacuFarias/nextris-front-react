import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Informes } from "../types/informes.types";
import {
    getMissingImageCandidates,
    linkMissingImage,
    type MissingImageCandidate,
} from "../services/missing-image.service";

interface MissingImageLinkModalProps {
    study: Informes;
    onClose: () => void;
    onLinked: () => void;
}

const formatDate = (date: string | null) => {
    if (!date || date.length !== 8) return date || "—";
    return `${date.slice(6, 8)}/${date.slice(4, 6)}/${date.slice(0, 4)}`;
};

const formatTime = (time: string | null) => {
    if (!time) return "—";
    const digits = time.replace(/\D/g, "");
    if (digits.length < 4) return time;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}${digits.length >= 6 ? `:${digits.slice(4, 6)}` : ""}`;
};

const MissingImageCandidateRow = ({
    candidate,
    isLinking,
    onLink,
}: {
    candidate: MissingImageCandidate;
    isLinking: boolean;
    onLink: () => void;
}) => (
    <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{candidate.study_description}</span>
                    {candidate.modality && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
                            {candidate.modality}
                        </span>
                    )}
                    {candidate.accession_matches && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                            Coincide por accession
                        </span>
                    )}
                </div>
                <div className="text-muted-foreground">{candidate.patient_name}</div>
                <div className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <span>Fecha: {formatDate(candidate.study_date)} {formatTime(candidate.study_time)}</span>
                    <span>Accession PACS: {candidate.accession_number || "—"}</span>
                    <span>{candidate.series_count} serie{candidate.series_count === 1 ? "" : "s"} · {candidate.instance_count} imagen{candidate.instance_count === 1 ? "" : "es"}</span>
                    <span className="truncate" title={candidate.study_instance_uid}>UID: {candidate.study_instance_uid}</span>
                </div>
            </div>
            <Button
                type="button"
                size="sm"
                className="shrink-0 gap-2"
                onClick={onLink}
                disabled={isLinking}
            >
                {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Vincular
            </Button>
        </div>
    </div>
);

export const MissingImageLinkModal = ({ study, onClose, onLinked }: MissingImageLinkModalProps) => {
    const [candidates, setCandidates] = useState<MissingImageCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingError, setLoadingError] = useState("");
    const [linkingPk, setLinkingPk] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setLoadingError("");
        void getMissingImageCandidates(study.guid)
            .then((response) => {
                if (!mounted) return;
                if (!response.success) {
                    throw new Error(response.message || "No se pudieron consultar los estudios");
                }
                setCandidates(response.data.candidates || []);
            })
            .catch((error: unknown) => {
                if (!mounted) return;
                const responseError = error as { response?: { data?: { message?: string } } };
                setLoadingError(responseError.response?.data?.message || (error instanceof Error ? error.message : "No se pudieron consultar los estudios PACS"));
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [study.guid]);

    const handleLink = async (candidate: MissingImageCandidate) => {
        setLinkingPk(candidate.pacs_study_pk);
        try {
            const response = await linkMissingImage(study.guid, candidate.pacs_study_pk);
            if (!response.success) {
                throw new Error(response.message || "No se pudieron vincular las imágenes");
            }
            toast.success("Imágenes vinculadas correctamente");
            onLinked();
        } catch (error: unknown) {
            const responseError = error as { response?: { data?: { message?: string } } };
            toast.error(responseError.response?.data?.message || (error instanceof Error ? error.message : "No se pudieron vincular las imágenes"));
        } finally {
            setLinkingPk(null);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open && linkingPk === null) onClose(); }}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-brand-purple" />
                        Vincular imágenes
                    </DialogTitle>
                    <DialogDescription>
                        Estudios PACS posibles para este paciente. Solo se muestran estudios que todavía no están vinculados.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <div><span className="font-medium">Paciente:</span> {study.patient_name}</div>
                    <div><span className="font-medium">Estudio:</span> {study.study_type || "—"}</div>
                    <div><span className="font-medium">Accession de la orden:</span> {study.accession_number || "—"}</div>
                </div>

                <div className="space-y-3">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
                            Buscando estudios PACS...
                        </div>
                    )}

                    {!isLoading && loadingError && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{loadingError}</span>
                        </div>
                    )}

                    {!isLoading && !loadingError && candidates.length === 0 && (
                        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                            <AlertCircle className="h-6 w-6" />
                            No se encontraron estudios PACS disponibles para este PatientID.
                        </div>
                    )}

                    {!isLoading && !loadingError && candidates.length > 0 && (
                        <>
                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>Los estudios marcados “Coincide por accession” son la opción recomendada. Los demás requieren validación manual antes de vincularlos.</span>
                            </div>
                            <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                                {candidates.map((candidate) => (
                                    <MissingImageCandidateRow
                                        key={candidate.pacs_study_pk}
                                        candidate={candidate}
                                        isLinking={linkingPk === candidate.pacs_study_pk}
                                        onLink={() => void handleLink(candidate)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={linkingPk !== null}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
