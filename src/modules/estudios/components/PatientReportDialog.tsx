import { brand } from '@/lib/brand';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PatientReportView } from '../types/patientReport';
import { PatientReportDocument, patientReportStyles } from './PatientReportDocument';

export function PatientReportDialog({ view, onClose }: { view: PatientReportView | null; onClose: () => void }) {
    const documentRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        return () => { frameRef.current?.remove(); frameRef.current = null; };
    }, [view]);

    const print = async () => {
        if (!documentRef.current) return;
        frameRef.current?.remove();
        const frame = document.createElement('iframe');
        frame.title = 'Impresión del informe';
        frame.setAttribute('aria-hidden', 'true');
        frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;';
        frameRef.current = frame;
        setPrinting(true);
        document.body.appendChild(frame);
        try {
            const printDocument = frame.contentDocument;
            const printWindow = frame.contentWindow;
            if (!printDocument || !printWindow) throw new Error('No se pudo preparar la impresión');
            printDocument.documentElement.lang = 'es';
            printDocument.title = brand.veterinary ? 'Informe veterinario' : 'Informe médico';
            const style = printDocument.createElement('style');
            style.textContent = patientReportStyles;
            printDocument.head.appendChild(style);
            // Clone only the already-sanitized document, without the portal or controls.
            printDocument.body.appendChild(documentRef.current.cloneNode(true));
            await Promise.all(Array.from(printDocument.images, image => image.decode()));
            await printDocument.fonts.ready;
            if (!frame.isConnected || frameRef.current !== frame) return;
            printWindow.addEventListener('afterprint', () => {
                frame.remove();
                if (frameRef.current === frame) { frameRef.current = null; setPrinting(false); }
            }, { once: true });
            printWindow.focus();
            printWindow.print();
        } catch {
            if (frame.isConnected) toast.error('No se pudo preparar la impresión. Intentá nuevamente.');
            frame.remove();
        } finally {
            if (frameRef.current === frame) setPrinting(false);
        }
    };

    return <Dialog open={view !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent showCloseButton={false} className="patient-form flex flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl sm:gap-0 sm:p-0">
            <DialogHeader className="relative shrink-0 border-b p-4 pr-16 text-left">
                <DialogTitle>{brand.veterinary ? 'Informe veterinario' : 'Informe médico'}</DialogTitle>
                <DialogDescription>{brand.name} · Solo lectura</DialogDescription>
                <Button variant="outline" className="mt-2 w-fit max-w-full whitespace-normal text-left" onClick={print} disabled={printing || !view}>
                    {printing ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
                    Imprimir / Guardar como PDF
                </Button>
                <DialogClose aria-label="Cerrar informe" title="Cerrar informe"
                    className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-md border bg-background hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <X className="size-5" aria-hidden="true" />
                </DialogClose>
            </DialogHeader>
            {view && <div className="table-scrollbar-purple min-h-0 overflow-y-auto bg-muted/30 p-2 sm:p-5">
                <style>{patientReportStyles}</style>
                <div ref={documentRef}><PatientReportDocument key={view.report.id_informe} view={view} /></div>
            </div>}
        </DialogContent>
    </Dialog>;
}
