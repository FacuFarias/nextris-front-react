import nextrisLogo from "@/assets/logo/logo5.png";
import { LocalReportContent } from './LocalReportContent';
import { ReportProfessionalSignatures } from './ReportProfessionalSignatures';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { informacionBasicaService } from '@/modules/configuracion/configuracion-tablas/institucional/informacion-basica/services/informacion-basica.service';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/fechaYhora';
import type { LocalReport } from '@/types/patientHistory';

export function LocalReportDialog({ report, onClose }: { report: LocalReport | null; onClose: () => void }) {
    const { data: institution } = useQuery({
        queryKey: ['institutional', 'info'],
        queryFn: informacionBasicaService.get,
        enabled: report !== null,
        staleTime: 300_000,
    });
    return (
        <Dialog open={report !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent showCloseButton={false} className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl sm:gap-0 sm:p-0">
                <DialogHeader className="relative shrink-0 border-b px-5 py-5 pr-16 text-left sm:px-6 sm:pr-16">
                    <div className="mb-3 flex items-center gap-4 border-b border-violet-200 pb-4 dark:border-violet-800">
                        <img src={institution?.logo_path || nextrisLogo} alt="Logo de la clínica" className="h-16 w-16 shrink-0 rounded bg-white object-contain p-1" />
                        <div className="min-w-0 break-words">
                            <p className="text-lg font-bold text-brand-purple dark:text-violet-200">{institution?.name || 'NextRIS'}</p>
                            {institution?.address && <p className="text-sm text-muted-foreground">{institution.address}</p>}
                        </div>
                    </div>
                    <DialogTitle className="leading-snug">{report?.procedimientos || 'Informe de NextRIS'}</DialogTitle>
                    <DialogDescription>
                        NextRIS · Solo lectura · {formatDateTime(report?.fecha)} · {report?.accession_number}
                    </DialogDescription>
                    <DialogClose
                        aria-label="Cerrar informe"
                        title="Cerrar informe"
                        className="absolute top-3 right-3 flex size-10 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </DialogClose>
                </DialogHeader>
                {report && <div className="table-scrollbar-purple min-h-0 space-y-6 overflow-y-auto break-words px-5 py-5 text-sm leading-relaxed sm:px-6">
                    <dl className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/40 p-4 sm:grid-cols-3">
                        <div className="min-w-0">
                            <dt className="mb-1 text-xs font-semibold text-muted-foreground">Profesional</dt>
                            <dd>{[report.profesional, report.profesional2].filter(Boolean).join(' / ') || 'No asignado'}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="mb-1 text-xs font-semibold text-muted-foreground">Solicitante</dt>
                            <dd>{report.solicitante || 'No informado'}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="mb-1 text-xs font-semibold text-muted-foreground">Categoría</dt>
                            <dd>{report.categoria || 'No informada'}</dd>
                        </div>
                        {report.materiales && <div className="sm:col-span-3">
                            <dt className="mb-1 text-xs font-semibold text-muted-foreground">Materiales</dt>
                            <dd>{report.materiales}</dd>
                        </div>}
                    </dl>
                    <LocalReportContent report={report} />
                    <ReportProfessionalSignatures report={report} />
                </div>}
            </DialogContent>
        </Dialog>
    );
}
