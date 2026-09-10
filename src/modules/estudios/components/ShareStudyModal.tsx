import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { estudiosService } from "../services/estudios.service";
import type { Study } from "../types";
import { formatDateTime } from "@/lib/fechaYhora";

interface ShareStudyModalProps {
    study: Study;
    onClose: () => void;
}

export const ShareStudyModal = ({ study, onClose }: ShareStudyModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [caseUrl, setCaseUrl] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleCreateLink = async () => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const response = await estudiosService.createCaseLink(study.examination_id);
            if (!response.success || !response.data?.case_url) {
                throw new Error(response.message || "No se pudo generar el enlace");
            }
            setCaseUrl(response.data.case_url);
            setExpiresAt(response.data.expires_at);
            toast.success("Case Link generado correctamente");
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err instanceof Error ? err.message : "No se pudo generar el Case Link");
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(caseUrl);
            toast.success("Enlace copiado al portapapeles");
        } catch {
            toast.error("No se pudo copiar el enlace");
        }
    };

    const handleOpen = () => window.open(caseUrl, "_blank", "noopener,noreferrer");

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-brand-purple" />
                        Compartir estudio
                    </DialogTitle>
                </DialogHeader>

                {caseUrl ? (
                    <div className="space-y-4 py-2">
                        <div className="flex flex-col items-center gap-2 rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                Case Link generado
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                El enlace permite consultar los datos del paciente, ver el estudio y abrir el reporte si está disponible.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Input value={caseUrl} readOnly className="text-sm" />
                            <Button variant="outline" onClick={handleCopy} title="Copiar enlace">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Vence: {expiresAt ? formatDateTime(expiresAt) : "-"}
                        </p>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={onClose}>Cerrar</Button>
                            <Button onClick={handleOpen} className="bg-brand-purple hover:bg-brand-purple/90 gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Abrir Case Link
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <>
                        <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
                            <p><span className="font-medium">Paciente:</span> {study.patient_name || "-"}</p>
                            <p><span className="font-medium">Estudio:</span> {study.study_type || "-"}</p>
                            <p><span className="font-medium">N° Acceso:</span> {study.accession_number || "-"}</p>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Se generará un enlace temporal para compartir este caso. El destinatario podrá ver el estudio y el reporte si está disponible.
                        </p>

                        {errorMessage && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                            <Button onClick={handleCreateLink} disabled={isLoading} className="bg-brand-purple hover:bg-brand-purple/90 gap-2">
                                {isLoading ? (
                                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                                ) : (
                                    <Share2 className="h-4 w-4" />
                                )}
                                Generar Case Link
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
