import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import type { PacsStudy } from "../hooks/use-studies-by-location"

type Series = { series_uid: string; series_no: number | null; series_desc: string | null; modality: string; instance_count: number }
type Instance = { sop_uid: string; instance_number: number | null; num_frames: number | null }
type Reason = { codeValue: string; codeMeaning: string }
type Page<T> = { items: T[]; total: number; page: number; per_page: number }
type Selection = { series_uid: string; sop_uid: string }
type Operation = {
  id: string; status: "preview" | "queued" | "running" | "completed" | "partial" | "failed"
  progress: { total: number; completed: number; failed: number }
  affected_examinations: { guid: string; accession_number: string | null; is_reported: number; is_signed: number }[]
  remaining_instances: number; has_images: boolean; error: string | null
  rejection_code: string | null; justification: string | null
  deletion_mode: "logical" | "permanent"
  targets: { series_iuid: string; sop_iuid: string; status: string; error: string | null }[]
}
const terminal = (status: string) => ["completed", "partial", "failed"].includes(status)
const reasonNames: Record<string, string> = { "113001": "Calidad de imagen", "113037": "Seguridad del paciente", "113038": "Entrada incorrecta de worklist" }
const statusNames: Record<string, string> = { queued: "En cola", running: "Eliminando imágenes…", completed: "Eliminación completada", partial: "Eliminación parcial", failed: "No se pudo completar la eliminación" }
const message = (error: unknown) => {
  const e = error as { response?: { data?: { message?: string } }; message?: string }
  return e.response?.data?.message || e.message || "No se pudo completar la operación"
}
async function get<T>(url: string): Promise<T> {
  return (await api.get(url)).data.data
}
function Pagination({ page, total, onChange, pageSize = 25 }: { page: number; total: number; onChange: (page: number) => void; pageSize?: number }) {
  return <div className="flex items-center justify-between gap-2 py-2 text-xs">
    <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>Anterior</Button>
    <span>Página {page} de {Math.max(1, Math.ceil(total / pageSize))} · {total} registros</span>
    <Button type="button" variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => onChange(page + 1)}>Siguiente</Button>
  </div>
}
function Thumbnail({ studyPk, seriesUid, sopUid }: { studyPk: number; seriesUid: string; sopUid: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  const load = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/dicom/studies/${studyPk}/series/${encodeURIComponent(seriesUid)}/instances/${encodeURIComponent(sopUid)}/thumbnail`, { responseType: "blob" })
      setUrl(URL.createObjectURL(response.data))
    } catch { setError("Miniatura no disponible") }
    finally { setLoading(false) }
  }
  return <div>{url ? <img src={url} alt="Miniatura DICOM" className="max-h-40 max-w-40" /> :
    <Button type="button" variant="ghost" size="sm" disabled={loading || Boolean(error)} onClick={load}>{loading ? "Cargando…" : error || "Ver miniatura"}</Button>}</div>
}

export function EliminarImagenesModal({ study, onClose }: { study: PacsStudy; onClose: () => void }) {
  const queryClient = useQueryClient()
  const storageKey = `image-deletion:${study.study_iuid}`
  const [level, setLevel] = useState<"study" | "series" | "instances">("study")
  const [seriesPage, setSeriesPage] = useState(1)
  const [instancePage, setInstancePage] = useState(1)
  const [activeSeries, setActiveSeries] = useState("")
  const [seriesSelection, setSeriesSelection] = useState<Set<string>>(new Set())
  const [instanceSelection, setInstanceSelection] = useState<Record<string, Selection>>({})
  const [reason, setReason] = useState("")
  const [justification, setJustification] = useState("")
  const [operation, setOperation] = useState<Operation | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [targetPage, setTargetPage] = useState(1)
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    let alive = true
    const restore = async () => {
      try {
        const saved = sessionStorage.getItem(storageKey)
        if (saved) {
          const op = await get<Operation>(`/dicom/image-deletions/${saved}`)
          if (alive) { setOperation(op); setReason(op.rejection_code || ""); setJustification(op.justification || "") }
        }
      } catch { sessionStorage.removeItem(storageKey) }
      finally { if (alive) setRestoring(false) }
    }
    void restore()
    return () => { alive = false }
  }, [storageKey])

  const reasons = useQuery({ queryKey: ["image-rejection-reasons"], queryFn: () => get<Reason[]>("/dicom/rejection-reasons"), staleTime: 60000 })
  const series = useQuery({ queryKey: ["image-deletion-series", study.pk, seriesPage],
    queryFn: () => get<Page<Series>>(`/dicom/studies/${study.pk}/series?page=${seriesPage}`), enabled: level !== "study" && !operation })
  const instances = useQuery({ queryKey: ["image-deletion-instances", study.pk, activeSeries, instancePage],
    queryFn: () => get<Page<Instance>>(`/dicom/studies/${study.pk}/series/${encodeURIComponent(activeSeries)}/instances?page=${instancePage}`),
    enabled: level === "instances" && Boolean(activeSeries) && !operation })
  const progress = useQuery({ queryKey: ["image-deletion", operation?.id, targetPage],
    queryFn: () => get<Operation>(`/dicom/image-deletions/${operation!.id}?page=${targetPage}`),
    enabled: Boolean(operation && operation.status !== "preview"),
    refetchInterval: (query) => terminal(query.state.data?.status || "") ? false : 1500 })
  const shown = progress.data || operation

  useEffect(() => {
    if (!progress.data) return
    for (const key of ["studies-by-location", "informes", "cargar-estudios", "patients", "patient-history-combined", "image-deletion-series", "image-deletion-instances"]) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
  }, [progress.data, queryClient])

  const prepare = async () => {
    setBusy(true); setError("")
    try {
      const response = await api.post("/dicom/image-deletions/preview", { study_pk: study.pk, level,
        series_uids: [...seriesSelection], instances: Object.values(instanceSelection) })
      setOperation(response.data.data)
    } catch (e) { setError(message(e)) }
    finally { setBusy(false) }
  }
  const execute = async () => {
    if (!shown) return
    setBusy(true); setError("")
    try {
      // Preserve the operation ID even if the confirmation response is lost.
      sessionStorage.setItem(storageKey, shown.id)
      const response = await api.post(`/dicom/image-deletions/${shown.id}/execute`, { rejection_code: reason, justification, permanent: shown.deletion_mode === "permanent" })
      setOperation(response.data.data)
      queryClient.setQueryData(["image-deletion", shown.id, targetPage], response.data.data)
      await progress.refetch()
    } catch (e) { setError(message(e)) }
    finally { setBusy(false) }
  }
  const canPrepare = level === "study" || (level === "series" ? seriesSelection.size > 0 : Object.keys(instanceSelection).length > 0)
  return <Modal isOpen onClose={onClose} title="Eliminar imágenes permanentemente" size="full" className="sm:max-w-5xl">
    <div className="space-y-4">
      <div className="rounded-md bg-muted p-3 text-sm">
        <p className="font-semibold">{study.patient_name} · {study.patient_id}</p>
        <p>{study.study_desc || "Sin descripción"} · ACC: {study.accession_no || "—"}</p>
        <p className="break-all text-xs text-muted-foreground">UID: {study.study_iuid}</p>
      </div>
      <p className="text-sm">Las imágenes seleccionadas se eliminarán permanentemente del PACS. Esta acción no se puede deshacer. El examen y su informe se conservan. Cada imagen multiframe se elimina con todos sus cuadros.</p>
      {restoring ? <p role="status">Consultando operaciones anteriores…</p> : !shown ? <>
        <label className="block text-sm font-medium">Eliminar
          <select className="mt-1 w-full rounded-md border bg-background p-2" value={level} onChange={e => setLevel(e.target.value as typeof level)}>
            <option value="study">Todas las imágenes del estudio</option><option value="series">Series completas</option><option value="instances">Imágenes individuales</option>
          </select>
        </label>
        {level !== "study" && <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="mb-2 font-medium">Series {level === "series" && `· ${seriesSelection.size} seleccionadas`}</p>
            {series.isPending && <p>Cargando series…</p>}
            {series.error && <p role="alert">{message(series.error)}</p>}
            {series.data?.items.map(s => <label key={s.series_uid} className="flex cursor-pointer items-start gap-2 border-b py-2 text-sm">
              <input type={level === "series" ? "checkbox" : "radio"} name="active-series"
                checked={level === "series" ? seriesSelection.has(s.series_uid) : activeSeries === s.series_uid}
                onChange={() => {
                  if (level === "series") setSeriesSelection(prev => { const next = new Set(prev); if (next.has(s.series_uid)) next.delete(s.series_uid); else next.add(s.series_uid); return next })
                  else { setActiveSeries(s.series_uid); setInstancePage(1) }
                }} />
              <span className="min-w-0"><span className="block">{s.series_no ?? "—"} · {s.series_desc || s.modality} · {s.instance_count} imágenes</span><span className="block break-all text-xs text-muted-foreground">{s.series_uid}</span></span>
            </label>)}
            {series.data && <Pagination page={seriesPage} total={series.data.total} onChange={setSeriesPage} />}
          </div>
          {level === "instances" && <div className="rounded-md border p-3">
            <p className="mb-2 font-medium">Imágenes · {Object.keys(instanceSelection).length} seleccionadas</p>
            {!activeSeries && <p className="text-sm">Seleccione una serie.</p>}
            {activeSeries && instances.isPending && <p>Cargando imágenes…</p>}
            {instances.error && <p role="alert">{message(instances.error)}</p>}
            {instances.data?.items.map(i => {
              const key = `${activeSeries}/${i.sop_uid}`
              return <div key={key} className="border-b py-2 text-sm"><label className="flex items-start gap-2">
                <input type="checkbox" checked={Boolean(instanceSelection[key])} onChange={() => setInstanceSelection(prev => {
                  const next = { ...prev }; if (next[key]) delete next[key]; else next[key] = { series_uid: activeSeries, sop_uid: i.sop_uid }; return next
                })} />
                <span className="min-w-0"><span className="block">Imagen {i.instance_number ?? "—"}{(i.num_frames || 0) > 1 && ` · ${i.num_frames} cuadros`}</span><span className="block break-all text-xs text-muted-foreground">{i.sop_uid}</span></span>
              </label><Thumbnail studyPk={study.pk} seriesUid={activeSeries} sopUid={i.sop_uid} /></div>
            })}
            {instances.data && <Pagination page={instancePage} total={instances.data.total} onChange={setInstancePage} />}
          </div>}
        </div>}
      </> : shown.status === "preview" ? <div className="space-y-2 rounded-md border border-amber-400 p-3 text-sm">
        <p className="font-semibold">Se eliminarán permanentemente {shown.progress.total} imágenes. Esta acción no se puede deshacer.</p>
        <p>Exámenes vinculados: {shown.affected_examinations.length}. Al eliminar la última imagen disponible, se mostrará «Sin imágenes».</p>
        {shown.affected_examinations.map(e => <p key={e.guid}>ACC: {e.accession_number || e.guid}{e.is_signed ? " · Informe firmado (se conserva)" : e.is_reported ? " · Informe disponible (se conserva)" : ""}</p>)}
      </div> : <div className="space-y-2 rounded-md border p-3 text-sm" role="status" aria-live="polite">
        <p className="font-semibold">{statusNames[shown.status]}</p>
        {shown.deletion_mode === "logical" && <p>Esta operación anterior realizó una baja lógica; los archivos pueden seguir en el PACS.</p>}
        <p>{shown.progress.completed} de {shown.progress.total} imágenes eliminadas · {shown.progress.failed} con error</p>
        <progress className="w-full" value={shown.progress.completed + shown.progress.failed} max={shown.progress.total} />
        <p>{shown.has_images ? `${shown.remaining_instances} imágenes disponibles en el estudio` : "Sin imágenes disponibles"}</p>
        {shown.error && <p className="text-destructive">{shown.error}</p>}
        {shown.targets.map(t => <p key={`${t.series_iuid}/${t.sop_iuid}`} className="break-all text-xs">{t.sop_iuid} · {t.status === "completed" ? "Eliminada" : t.status === "failed" ? "Error" : "Pendiente"}{t.error && `: ${t.error}`}</p>)}
        <Pagination page={targetPage} total={shown.progress.total} pageSize={50} onChange={setTargetPage} />
        {!terminal(shown.status) && <p>La purga de archivos puede tardar varios minutos. Puede cerrar esta ventana; la operación continuará en segundo plano.</p>}
      </div>}
      {(!shown || shown.status === "preview") && <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">Motivo de eliminación
          <select className="mt-1 w-full rounded-md border bg-background p-2" value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">Seleccione un motivo</option>{reasons.data?.map(r => <option key={r.codeValue} value={r.codeValue}>{reasonNames[r.codeValue] || r.codeMeaning}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Justificación
          <textarea className="mt-1 w-full rounded-md border bg-background p-2" maxLength={2000} value={justification} onChange={e => setJustification(e.target.value)} />
        </label>
      </div>}
      {(error || progress.error || reasons.error) && <p role="alert" className="text-sm text-destructive">{error || message(progress.error || reasons.error)}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        {shown?.status === "preview" && <Button type="button" variant="outline" disabled={busy} onClick={() => { setOperation(null); setError("") }}>Revisar selección</Button>}
        {!shown && <Button type="button" disabled={busy || restoring || !canPrepare} onClick={prepare}>{busy ? "Preparando…" : "Revisar eliminación"}</Button>}
        {shown?.status === "preview" && <Button type="button" variant="destructive" disabled={busy || !reason || !justification.trim() || reasons.isError} onClick={execute}>{busy ? "Confirmando…" : "Eliminar permanentemente"}</Button>}
        {shown?.deletion_mode === "permanent" && ["partial", "failed"].includes(shown.status) && <Button type="button" variant="destructive" disabled={busy} onClick={execute}>Reintentar imágenes pendientes</Button>}
        {shown && terminal(shown.status) && <Button type="button" variant="outline" onClick={() => { sessionStorage.removeItem(storageKey); setOperation(null); setTargetPage(1); queryClient.removeQueries({ queryKey: ["image-deletion", shown.id] }) }}>Nueva selección</Button>}
      </div>
    </div>
  </Modal>
}
