import { AlertTriangle, Link2Off, Loader2, RefreshCw, Search, Unlink2 } from "lucide-react"
import { useMemo, useState } from "react"
import { PrimaryButton, SecondaryButton } from "@/components"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useDesvincularEstudio, useEstudiosVinculados } from "../hooks/use-cargar-estudios"
import type { LinkedStudyData } from "../types/cargar-estudios.types"
import { formatDate as formatVisibleDate } from "@/lib/fechaYhora"
import { TableRefreshStatus } from "@/components/TableRefreshStatus"
import { useRowHighlights } from "@/hooks/use-row-highlights"

const formatDate = (value?: string | null) => value ? formatVisibleDate(value) : "N/A"

export const DesvincularImagenTab = () => {
    const [selectedLink, setSelectedLink] = useState<LinkedStudyData | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [reason, setReason] = useState("Desvinculacion manual desde pestaña")

    const { estudiosVinculadosData, isLoading, isFetching, error, refetchEstudiosVinculados } = useEstudiosVinculados()
    const { mutate: desvincularEstudio, isPending } = useDesvincularEstudio()

    const linkedData = estudiosVinculadosData?.data?.data || []
    const getLinkId = (item: LinkedStudyData) => `${item.link_id ?? 'legacy'}-${item.examination_guid}-${item.study_instance_uid}`
    const changedLinks = useRowHighlights(
        linkedData,
        "linked-studies",
        !isLoading,
        getLinkId,
        (item) => [item.patient_name, item.patient_id, item.order_accession, item.study_type, item.source, item.linked_at],
    )

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return linkedData
        const term = searchTerm.toLowerCase()
        return linkedData.filter((item) => {
            return (
                item.patient_name.toLowerCase().includes(term)
                || item.patient_id.toLowerCase().includes(term)
                || item.order_accession.toLowerCase().includes(term)
                || (item.study_type || "").toLowerCase().includes(term)
                || (item.study_instance_uid || "").toLowerCase().includes(term)
            )
        })
    }, [linkedData, searchTerm])

    const handleDesvincular = () => {
        if (!selectedLink) return

        const payload = {
            link_id: selectedLink.link_id ?? undefined,
            examination_guid: selectedLink.examination_guid ?? undefined,
            pacs_study_pk: selectedLink.pacs_study_pk ?? undefined,
            study_instance_uid: selectedLink.study_instance_uid ?? undefined,
            reason,
        }

        desvincularEstudio(payload, {
            onSuccess: () => {
                setIsModalOpen(false)
                setSelectedLink(null)
                refetchEstudiosVinculados()
            },
        })
    }

    return (
        <>
            <div className="relative overflow-x-auto overflow-y-hidden rounded-xl border border-amber-200 shadow-sm dark:border-amber-900">
                    <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-4 text-white">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/15 p-2 rounded-lg">
                                    <Unlink2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold leading-tight">Estudios Vinculados</h2>
                                    <p className="text-xs text-white/70 mt-0.5">Selecciona una fila para desvincularla de su orden</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                    {estudiosVinculadosData?.data?.total ?? 0}
                                </span>
                                <button
                                    onClick={() => refetchEstudiosVinculados()}
                                    disabled={isFetching}
                                    className="bg-white/15 hover:bg-white/25 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                    title="Actualizar"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="relative mt-3">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
                            <input
                                placeholder="Buscar por paciente, DNI, accession o estudio..."
                                className="w-full bg-white/15 placeholder-white/50 text-white text-xs pl-8 pr-3 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="min-w-[680px] bg-transparent">
                        <div className="grid grid-cols-6 px-4 py-2.5 bg-transparent border-b border-gray-200/60 dark:border-gray-700/60">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Paciente</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">DNI</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Orden</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fuente</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha</span>
                        </div>

                        <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                            {isLoading ? (
                                <div className="py-16" />
                            ) : error && !estudiosVinculadosData ? (
                                <div className="py-16 text-center text-xs text-red-500">No se pudieron cargar los vínculos</div>
                            ) : filteredData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
                                        <Link2Off className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm">No hay estudios vinculados para mostrar</p>
                                </div>
                            ) : (
                                filteredData.map((item) => {
                                    const isSelected = selectedLink?.link_id === item.link_id
                                        && selectedLink?.examination_guid === item.examination_guid
                                        && selectedLink?.study_instance_uid === item.study_instance_uid

                                    return (
                                        <div
                                            key={getLinkId(item)}
                                            onClick={() => setSelectedLink(item)}
                                            className={`grid grid-cols-6 px-4 py-3 cursor-pointer transition-all border-b border-gray-100 dark:border-gray-700/60 ${changedLinks.has(getLinkId(item)) ? 'row-change-highlight' : ''}
                                                ${isSelected
                                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-l-2 border-l-orange-500'
                                                    : 'hover:bg-white/5 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.patient_name}</span>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 self-center truncate">{item.patient_id}</span>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 self-center truncate">{item.order_accession}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 self-center truncate" title={item.study_type}>{item.study_type}</span>
                                            <span className="text-xs self-center">
                                                <span className="inline-block px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-medium">
                                                    {item.source}
                                                </span>
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 self-center">{formatDate(item.linked_at)}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    <div className="px-4 py-3 border-t border-gray-200/60 dark:border-gray-700/60 bg-transparent flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {selectedLink
                                ? `Seleccionado: ${selectedLink.patient_name} | Orden ${selectedLink.order_accession}`
                                : 'Selecciona un vínculo para poder desvincular'}
                        </p>
                        <Button
                            disabled={!selectedLink}
                            onClick={() => setIsModalOpen(true)}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Unlink2 className="w-4 h-4 mr-2" />
                            Desvincular
                        </Button>
                    </div>
                    <TableRefreshStatus refreshing={isFetching} error={Boolean(error && estudiosVinculadosData)} />
                </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl dark:bg-[#2a2e32] dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-orange-600 dark:text-orange-400">Confirmar Desvinculacion</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Esta acción quitará la imagen asociada a la orden seleccionada.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg border border-orange-200 dark:border-orange-900 p-4 bg-orange-50 dark:bg-orange-900/10 mt-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{selectedLink?.patient_name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Orden: {selectedLink?.order_accession} | Tipo: {selectedLink?.study_type}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 break-all">
                            Study UID: {selectedLink?.study_instance_uid || 'N/A'}
                        </p>
                    </div>

                    <div className="mt-4">
                        <label htmlFor="unlink-reason" className="text-sm font-medium text-gray-700 dark:text-gray-200">Motivo</label>
                        <textarea
                            id="unlink-reason"
                            className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-[#1f2428] dark:text-gray-100 px-3 py-2 text-sm"
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>Si la orden no tiene más estudios vinculados, se marcará sin imagen para volver a aparecer en la lista de vinculación.</p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton onClick={handleDesvincular} disabled={isPending}>
                            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlink2 className="w-4 h-4 mr-2" />}
                            Confirmar desvinculación
                        </PrimaryButton>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
