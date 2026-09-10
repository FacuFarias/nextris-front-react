import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Copy, ExternalLink, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { createCaseLink, createImageShareLink } from "../services/informes.service";
import QRCode from "qrcode";
import { formatDateTime } from "@/lib/fechaYhora";

type ShareKind = "images" | "study";

interface AdministrativeShareModalProps {
    kind: ShareKind;
    examId: string;
    studyIuid?: string | null;
    patientName?: string;
    studyDescription?: string;
    onClose: () => void;
}

export const AdministrativeShareModal = ({
    kind,
    examId,
    studyIuid,
    patientName,
    studyDescription,
    onClose,
}: AdministrativeShareModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [reason, setReason] = useState("");
    const [sendEmail, setSendEmail] = useState(false);
    const [email, setEmail] = useState("");

    const isStudyLink = kind === "study";
    const title = isStudyLink ? "Compartir estudio" : "Compartir imágenes";

    const handleCreate = useCallback(async () => {
        if (!isStudyLink && !studyIuid) {
            toast.error("El estudio no tiene Study Instance UID");
            return;
        }
        if (sendEmail && !email.trim()) {
            toast.error("Ingresa un email de destino");
            return;
        }

        setIsLoading(true);
        try {
            const response = isStudyLink
                ? await createCaseLink(examId)
                : await createImageShareLink(studyIuid!, {
                    reason: reason.trim() || undefined,
                    patient_email: sendEmail ? email.trim() : undefined,
                });

            if (!response.success || !response.data?.share_url) {
                throw new Error(response.message || "No se pudo generar el enlace");
            }

            const generatedUrl = isStudyLink
                ? (response as Awaited<ReturnType<typeof createCaseLink>>).data.case_url
                : response.data.share_url;
            const generatedQr = await QRCode.toDataURL(generatedUrl, {
                width: 360,
                margin: 2,
                errorCorrectionLevel: "M",
                color: { dark: "#24113f", light: "#ffffff" },
            });
            setQrDataUrl(generatedQr);
            setShareUrl(generatedUrl);
            setExpiresAt(response.data.expires_at);
            if (!isStudyLink && (response as Awaited<ReturnType<typeof createImageShareLink>>).data.email_sent) {
                toast.success(`Enlace generado y enviado a ${email.trim()}`);
            } else {
                toast.success("Enlace generado correctamente");
            }
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
                || (error instanceof Error ? error.message : "No se pudo generar el enlace");
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [email, examId, isStudyLink, reason, sendEmail, studyIuid]);

    useEffect(() => {
        if (!shareUrl && (kind === "study" || studyIuid)) {
            void handleCreate();
        }
    }, [kind, studyIuid, shareUrl, handleCreate]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Enlace copiado al portapapeles");
        } catch {
            toast.error("No se pudo copiar el enlace");
        }
    };

    const shareMessage = [
        isStudyLink ? "Compartir estudio" : "Compartir imágenes",
        patientName ? `Paciente: ${patientName}` : "",
        studyDescription ? `Estudio: ${studyDescription}` : "",
        "",
        shareUrl,
    ].filter(Boolean).join("\n");

    const handleCopyMessage = async () => {
        try {
            await navigator.clipboard.writeText(shareMessage);
            toast.success("Mensaje copiado para WhatsApp");
        } catch {
            toast.error("No se pudo copiar el mensaje");
        }
    };

    const handleCopyQrAndMessage = async () => {
        try {
            const qrBlob = await (await fetch(qrDataUrl)).blob();
            if (navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        "image/png": qrBlob,
                        "text/plain": new Blob([shareMessage], { type: "text/plain" }),
                    }),
                ]);
                toast.success("QR y mensaje copiados al portapapeles");
                return;
            }
            await navigator.clipboard.writeText(shareMessage);
            toast.success("Mensaje copiado; descarga el QR para adjuntarlo");
        } catch {
            toast.error("No se pudo copiar el QR y el mensaje");
        }
    };

    const handleDownloadQr = () => {
        const link = document.createElement("a");
        link.href = qrDataUrl;
        link.download = `qr-compartir-${examId}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("QR descargado");
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-brand-purple" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {isStudyLink
                            ? "Genera un Case Link con los datos del paciente, las imágenes y el reporte disponible."
                            : "Genera un enlace temporal para visualizar las imágenes del estudio."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
                        <p><span className="font-medium">Paciente:</span> {patientName || "-"}</p>
                        <p><span className="font-medium">Estudio:</span> {studyDescription || "-"}</p>
                    </div>

                    {!shareUrl && isLoading && (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-purple-100 bg-purple-50 p-8 text-center dark:border-purple-900/50 dark:bg-purple-950/20">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">Generando enlace y código QR...</p>
                        </div>
                    )}

                    {!shareUrl && !isLoading && !isStudyLink && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="administrative-share-reason">Motivo (opcional)</Label>
                                <Input
                                    id="administrative-share-reason"
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    placeholder="Motivo del enlace"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="administrative-share-email"
                                    checked={sendEmail}
                                    onCheckedChange={(checked) => setSendEmail(Boolean(checked))}
                                />
                                <Label htmlFor="administrative-share-email" className="cursor-pointer">
                                    Enviar enlace por email
                                </Label>
                            </div>
                            {sendEmail && (
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="destinatario@correo.com"
                                />
                            )}
                        </>
                    )}

                    {shareUrl && (
                        <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                            <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-200">
                                <CheckCircle className="h-5 w-5" />
                                Enlace generado
                            </div>
                            {qrDataUrl && (
                                <div className="flex flex-col items-center gap-2 rounded-md bg-white p-3">
                                    <img
                                        src={qrDataUrl}
                                        alt="Código QR del enlace compartido"
                                        className="h-48 w-48"
                                    />
                                    <p className="text-center text-xs text-gray-500">
                                        Escanea este QR para abrir el enlace
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Input value={shareUrl} readOnly className="text-sm" />
                                <Button variant="outline" onClick={handleCopy} title="Copiar enlace">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <Button variant="outline" onClick={handleDownloadQr} className="gap-2">
                                    Descargar QR
                                </Button>
                                <Button variant="outline" onClick={handleCopyMessage} className="gap-2">
                                    Copiar mensaje
                                </Button>
                                <Button onClick={handleCopyQrAndMessage} className="gap-2">
                                    Copiar QR + mensaje
                                </Button>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                Vence: {expiresAt ? formatDateTime(expiresAt) : "-"}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cerrar</Button>
                    {shareUrl ? (
                        <Button onClick={() => window.open(shareUrl, "_blank", "noopener,noreferrer")} className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Abrir enlace
                        </Button>
                    ) : !shareUrl && !isLoading ? (
                        <Button onClick={handleCreate} disabled={isLoading} className="gap-2">
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Generar enlace
                        </Button>
                    ) : null}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
