import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, CheckCircle, Copy, Download, ExternalLink, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/fechaYhora";
import type { StudyShareState } from "../hooks/use-study-share";

interface ShareStudyModalProps {
    state: StudyShareState;
    onClose: () => void;
    onCopy: () => void;
    onRetry: () => void;
    onRetryQr: () => void;
}

export const ShareStudyModal = ({ state, onClose, onCopy, onRetry, onRetryQr }: ShareStudyModalProps) => {
    const [sharing, setSharing] = useState(false);
    const [shareError, setShareError] = useState("");
    const { study, link, qr, loading, error, qrError, qrLoading, copyStatus, expired } = state;
    const nativeAvailable = typeof navigator.share === "function";
    const handleShare = async () => {
        if (!link || expired || sharing) return;
        setSharing(true);
        setShareError("");
        try {
            await navigator.share({ title: "Estudio médico compartido", url: link.case_url });
        } catch (error) {
            if (!(error instanceof DOMException && error.name === "AbortError")) setShareError("No se pudo abrir el menú de aplicaciones. Puedes copiar el enlace.");
        } finally {
            setSharing(false);
        }
    };
    const downloadQr = () => {
        const anchor = document.createElement("a");
        anchor.href = qr;
        anchor.download = `qr-estudio-${study.examination_id}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
            <DialogContent className="patient-share sm:max-w-lg [&>button[data-slot=dialog-close]]:text-foreground">
                <DialogHeader className="pr-8 text-left">
                    <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 shrink-0 text-brand-purple" />Compartir estudio</DialogTitle>
                    <DialogDescription>Comparte el enlace o permite que escaneen el QR para consultar las imágenes de este estudio.</DialogDescription>
                </DialogHeader>
                <div className="min-w-0 space-y-1 rounded-xl bg-muted p-3 text-sm [overflow-wrap:anywhere]">
                    <p className="font-semibold">{study.study_type || "Estudio médico"}</p>
                    <p className="text-muted-foreground">{study.patient_name} · N.º acceso: {study.accession_number || "-"}</p>
                </div>
                {loading && <div role="status" className="flex items-center justify-center gap-3 py-10"><Loader2 className="h-6 w-6 animate-spin text-brand-purple" />Preparando enlace y QR…</div>}
                {error && <div role="alert" className="space-y-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"><p>{error}</p><Button variant="outline" onClick={onRetry}>Reintentar enlace</Button></div>}
                {link && (
                    <div className="min-w-0 space-y-4">
                        {expired ? <div role="alert" className="space-y-2 rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-100"><p>Este enlace venció.</p><Button onClick={onRetry}>Generar nuevo enlace</Button></div> : (
                            <>
                                <p role="status" aria-live="polite" className="flex items-start gap-2 text-sm">
                                    {copyStatus === "copied" && <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />}
                                    {copyStatus === "copied" ? "Enlace copiado al portapapeles" : copyStatus === "copying" ? "Copiando enlace…" : "No se pudo copiar automáticamente. Usa Copiar enlace o mantén presionado el enlace para copiarlo."}
                                </p>
                                <div className="flex flex-col items-center gap-2">
                                    {qrLoading && <p role="status" className="py-6 text-sm">Generando QR…</p>}
                                    {qr && <><img src={qr} alt="Código QR del enlace del estudio" className="h-auto w-52 max-w-full rounded-lg bg-white" /><p className="text-center text-xs text-muted-foreground">Escanea el QR para abrir el estudio</p></>}
                                    {qrError && <div role="alert" className="space-y-2 text-center text-sm"><p>{qrError}</p><Button variant="outline" onClick={onRetryQr}>Reintentar QR</Button></div>}
                                </div>
                                <label htmlFor="patient-share-url" className="block text-sm font-medium">Enlace del estudio</label>
                                <Input id="patient-share-url" value={link.case_url} readOnly onFocus={event => event.currentTarget.select()} className="min-w-0 text-base" />
                                <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                                    {nativeAvailable && <Button onClick={handleShare} disabled={sharing} className="gap-2 bg-brand-purple text-white hover:bg-brand-purple/90 min-[400px]:col-span-2"><Share2 className="h-4 w-4" />{sharing ? "Abriendo aplicaciones…" : "Compartir en aplicaciones"}</Button>}
                                    <Button variant="outline" onClick={onCopy} disabled={copyStatus === "copying"} className="gap-2"><Copy className="h-4 w-4" />Copiar enlace</Button>
                                    <Button variant="outline" onClick={downloadQr} disabled={!qr || qrLoading} className="gap-2"><Download className="h-4 w-4" />Descargar QR</Button>
                                </div>
                                {shareError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{shareError}</p>}
                            </>
                        )}
                        <p className="text-xs text-muted-foreground">Vence: {formatDateTime(link.expires_at)}</p>
                        <p className="text-xs text-muted-foreground">El destinatario podrá consultar los datos del paciente y las imágenes. La consulta del reporte en este enlace está deshabilitada temporalmente.</p>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    {link && !expired && <Button variant="outline" onClick={() => window.open(link.case_url, "_blank", "noopener,noreferrer")} className="gap-2"><ExternalLink className="h-4 w-4" />Abrir enlace</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
