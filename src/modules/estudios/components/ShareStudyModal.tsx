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
import { Label } from "@/components/ui/label";
import { Share2, CheckCircle, AlertCircle } from "lucide-react";
import { estudiosService } from "../services/estudios.service";
import type { Study } from "../types";

interface ShareStudyModalProps {
    study: Study;
    onClose: () => void;
}

export const ShareStudyModal = ({ study, onClose }: ShareStudyModalProps) => {
    const [email, setEmail] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<"success" | "error" | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const handleShare = async () => {
        if (!email.trim()) return;
        setIsLoading(true);
        setResult(null);
        try {
            await estudiosService.shareStudy(study.examination_id, email.trim(), doctorName.trim());
            setResult("success");
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Error al enviar el informe. Intente nuevamente.";
            setErrorMessage(message);
            setResult("error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-brand-purple" />
                        Compartir informe
                    </DialogTitle>
                </DialogHeader>

                {result === "success" ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="text-center text-sm text-gray-700 dark:text-gray-300">
                            El informe fue enviado correctamente a <strong>{email}</strong>.
                        </p>
                        <Button onClick={onClose} className="mt-2 bg-brand-purple hover:bg-brand-purple/90">
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 pb-2">
                            <p><span className="font-medium">Estudio:</span> {study.study_type}</p>
                            <p><span className="font-medium">N° Acceso:</span> {study.accession_number}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="doctor-name">Nombre del médico (opcional)</Label>
                                <Input
                                    id="doctor-name"
                                    placeholder="Ej: Dr. Juan García"
                                    value={doctorName}
                                    onChange={(e) => setDoctorName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">Email del médico *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="medico@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleShare(); }}
                                />
                            </div>

                            {result === "error" && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleShare}
                                disabled={!email.trim() || isLoading}
                                className="bg-brand-purple hover:bg-brand-purple/90 gap-2"
                            >
                                {isLoading ? (
                                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                                ) : (
                                    <Share2 className="h-4 w-4" />
                                )}
                                Enviar informe
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
