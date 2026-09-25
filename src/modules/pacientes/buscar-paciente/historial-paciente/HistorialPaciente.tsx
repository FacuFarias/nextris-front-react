import { MainLayout } from '@/layouts/layout'
import { useLocation, useNavigate } from 'react-router-dom'
import { useHistorialPaciente, useViewImagenDicom, useToggleExamVisibility } from './hooks/use-historial-paciente';
import { Search, ArrowLeft } from 'lucide-react';
import { InputSearch } from '@/components/InputSearch';
import { useMemo, useState } from 'react';
import { TablaDynamic } from '@/components/TableDynamic';
import { formatDateTime } from '@/lib/fechaYhora';
import type { HistoryPatient } from '../types/BuscarPaciente';
import { getHistoryPatientActions, historyColumns } from './components/columns';
import { DynamicBreadcrumb } from '@/components/DynamicBreadcrumb';
import { Button } from '@/components/ui/button';
import fondoImage from "@/assets/fondo1.png";
import backDarkImage from "@/assets/back-dark.jpg";
import { useDebounce } from '@uidotdev/usehooks';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { openReportPdf } from "@/services/reportPdf"

export const HistorialPaciente = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { authData } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const patient = location?.state?.patient;
    const { historyData, isLoading } = useHistorialPaciente({ patientId: patient?.guid || '' });
    const { viewImagenDicom } = useViewImagenDicom();
    const { toggleVisibility } = useToggleExamVisibility();

    const [shareDialogOpen, setShareDialogOpen] = useState(false)
    const [shareReason, setShareReason] = useState("")
    const [shareEmailEnabled, setShareEmailEnabled] = useState(false)
    const [sharePatientEmail, setSharePatientEmail] = useState("")
    const [shareUrl, setShareUrl] = useState("")
    const [shareExpiresAt, setShareExpiresAt] = useState("")
    const [selectedPatientToShare, setSelectedPatientToShare] = useState<HistoryPatient | null>(null)
    const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false)

    const onOpenShareDialog = (patient: HistoryPatient) => {
        if (!patient.studyinstanceuid) {
            toast.error("El estudio no tiene Study Instance UID")
            return
        }
        setSelectedPatientToShare(patient)
        setShareReason("")
        setShareEmailEnabled(false)
        setSharePatientEmail("")
        setShareUrl("")
        setShareExpiresAt("")
        setShareDialogOpen(true)
    }

    const onGenerateShareLink = async () => {
        if (!selectedPatientToShare?.studyinstanceuid) {
            toast.error("No se pudo identificar el estudio")
            return
        }

        const authDataRaw = localStorage.getItem("authData")
        const token = authDataRaw ? JSON.parse(authDataRaw).access_token : null
        if (!token) {
            toast.error("Sesión no válida. Inicie sesión nuevamente")
            return
        }

        setIsGeneratingShareLink(true)
        try {
            const response = await fetch("/api/general/viewer-share-links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    study_iuid: selectedPatientToShare.studyinstanceuid,
                    expires_hours: 720,
                    reason: shareReason || undefined,
                    patient_email: shareEmailEnabled && sharePatientEmail.trim() ? sharePatientEmail.trim() : undefined,
                }),
            })

            const data = await response.json()
            if (!response.ok || !data?.success) {
                toast.error(data?.message || "No se pudo generar el enlace")
                return
            }

            setShareUrl(data.data.share_url)
            setShareExpiresAt(data.data.expires_at)
            if (data.data.email_sent) {
                toast.success(`Enlace generado y enviado a ${sharePatientEmail}`)
            } else if (shareEmailEnabled && sharePatientEmail.trim()) {
                toast.warning("Enlace generado, pero no se pudo enviar el email")
            } else {
                toast.success("Enlace temporal generado")
            }
        } catch {
            toast.error("No se pudo generar el enlace temporal")
        } finally {
            setIsGeneratingShareLink(false)
        }
    }

    const onCopyShareUrl = async () => {
        if (!shareUrl) return
        try {
            await navigator.clipboard.writeText(shareUrl)
            toast.success("Enlace copiado al portapapeles")
        } catch {
            toast.error("No se pudo copiar el enlace")
        }
    }

    const onViewImage = (patient: HistoryPatient) => {
        const currentUserId = authData?.user?.id;
        if (!currentUserId) {
            return;
        }
        viewImagenDicom({ imageId: patient.guid, userId: currentUserId });
    };

    const onViewReport = async (patient: HistoryPatient) => {
        if (!patient.report_available) {
            return;
        }
        try {
            await openReportPdf(patient.guid);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No se pudo abrir el informe');
        }
    };

    const onToggleVisibility = (patient: HistoryPatient) => {
        toggleVisibility(patient.guid);
    };

    // Generar las acciones con las funciones
    const patientActions = getHistoryPatientActions(
        onViewReport,
        onViewImage,
        onToggleVisibility,
        onOpenShareDialog
    );

    // Filtrado local por búsqueda
    const filteredData = useMemo(() => {
        const data = historyData?.data || [];
        if (!debouncedSearch) return data;
        const search = debouncedSearch.toLowerCase();
        return data.filter((item) =>
            item.estudio?.toLowerCase().includes(search) ||
            item.medico_autor?.toLowerCase().includes(search) ||
            item.medico_referente?.toLowerCase().includes(search) ||
            item.modalidad?.toLowerCase().includes(search) ||
            item.fecha?.toLowerCase().includes(search)
        );
    }, [historyData?.data, debouncedSearch]);

    // Paginación local
    const paginatedData = useMemo(() => {
        const start = (page - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, page, perPage]);

    const pagination = {
        page,
        pageSize: perPage,
        total: filteredData.length,
    };

    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm border border-border z-10 h-full flex flex-col overflow-hidden">
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex justify-between items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex gap-2 items-center">
                        <div className="bg-brand-purple p-2 sm:p-3 rounded-lg w-min">
                            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">Historial Paciente / {patient?.name} {patient?.surname}</h1>
                    </div>

                    <Button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 bg-transparent text-gray-600 mb-4 hover:bg-transparent"
                    >
                        <ArrowLeft className="w-5 h-5 dark:text-purple-400" />
                        <span className="font-medium dark:text-purple-400">Volver</span>
                    </Button>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={(value) => {
                            setSearchTerm(value);
                            setPage(1);
                        }}
                        placeholder="Buscar estudio, médico, modalidad..."
                    />
                </div>


                <TablaDynamic<HistoryPatient>
                    data={paginatedData}
                    filterAnimationKey={debouncedSearch}
                    columns={historyColumns}
                    showIndex
                    loading={isLoading}
                    actions={patientActions}
                    pagination={pagination}
                    onPaginationChange={(newPage) => {
                        setPage(newPage);
                    }}
                    perPageValue={perPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        setPage(1);
                    }}
                    perPageOptions={[10, 20, 50, 100]}
                    tableBackgroundImage={fondoImage}
                    tableBackgroundImageDark={backDarkImage}
                    mobileMode="cards"
                />
            </div>

            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent className="sm:max-w-xl" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Compartir enlace temporal</DialogTitle>
                        <DialogDescription>
                            Genera un enlace válido por 24 horas para que el paciente abra este estudio en el visor.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-[#25292e]">
                            <p><span className="font-semibold">Estudio:</span> {selectedPatientToShare?.estudio || "-"}</p>
                            <p><span className="font-semibold">Study UID:</span> {selectedPatientToShare?.studyinstanceuid || "-"}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="share-reason">Motivo (opcional)</Label>
                            <Input id="share-reason" placeholder="Ej: entrega de resultados al paciente"
                                   value={shareReason} onChange={(e) => setShareReason(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Checkbox id="share-email-toggle" checked={shareEmailEnabled}
                                          onCheckedChange={(checked) => { setShareEmailEnabled(!!checked); if (!checked) setSharePatientEmail("") }} />
                                <Label htmlFor="share-email-toggle" className="cursor-pointer">Enviar enlace por email</Label>
                            </div>
                            {shareEmailEnabled && (
                                <Input id="share-patient-email" type="email" placeholder="destinatario@correo.com"
                                       value={sharePatientEmail} onChange={(e) => setSharePatientEmail(e.target.value)} autoFocus />
                            )}
                        </div>

                        {shareUrl ? (
                            <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                                <Label htmlFor="share-url">Enlace generado</Label>
                                <Input id="share-url" value={shareUrl} readOnly />
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    Expira: {shareExpiresAt ? formatDateTime(shareExpiresAt) : "-"}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShareDialogOpen(false)} disabled={isGeneratingShareLink}>
                            Cerrar
                        </Button>
                        {shareUrl ? (
                            <Button onClick={onCopyShareUrl}>Copiar enlace</Button>
                        ) : (
                            <Button onClick={onGenerateShareLink}
                                    disabled={isGeneratingShareLink || (shareEmailEnabled && !sharePatientEmail.trim())}>
                                {isGeneratingShareLink ? "Generando..." : "Generar enlace"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    )
}
