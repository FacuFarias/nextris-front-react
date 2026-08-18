import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import TablaDynamic from "@/components/TableDynamic"
import { MainLayout } from "@/layouts/layout"
import { useDebounce } from "@uidotdev/usehooks"
import { Image as ImageIcon, Loader2, RefreshCcw, SlidersHorizontal, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterPresetTabs } from "./components/FilterPresetTabs"
import { getImageActions, imageColumns } from "./components/columns"
import { ReasignarImagenModal } from "./components/ReasignarImagenModal"
import { EditarEstudioModal } from "./components/EditarEstudioModal"
import { useImageFilterPresets } from "./hooks/use-filter-presets"
import { useStudiesByLocation } from "./hooks/use-studies-by-location"
import type { PacsStudy } from "./hooks/use-studies-by-location"
import type { ImageFilterPreset, ImageFilterPresetFilters } from "./types/filter-preset.types"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"

const DEFAULT_VISIBLE_COLUMNS = imageColumns
    .map((col) => col.key as string)
    .filter((key) => !["updated_time", "study_time", "study_datetime", "sending_aet"].includes(key))

export const Imagenes = () => {
  const isMobile = useIsMobile()
  const { authData } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [dateRange, setDateRange] = useState<string>("all")
  const [dateField, setDateField] = useState<string>("arrival")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState("study_datetime")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS)
  const [showFilters, setShowFilters] = useState(() => typeof window === "undefined" || window.innerWidth >= 768)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareReason, setShareReason] = useState("")
  const [shareEmailEnabled, setShareEmailEnabled] = useState(false)
  const [sharePatientEmail, setSharePatientEmail] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [shareExpiresAt, setShareExpiresAt] = useState("")
  const [selectedStudyToShare, setSelectedStudyToShare] = useState<PacsStudy | null>(null)
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false)
  const [activeLinksByStudy, setActiveLinksByStudy] = useState<Record<string, { is_active: boolean; share_url?: string }>>({})
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [selectedStudyToReassign, setSelectedStudyToReassign] = useState<PacsStudy | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedStudyToEdit, setSelectedStudyToEdit] = useState<PacsStudy | null>(null)
  const [selectedModality, setSelectedModality] = useState<string>("all")
  const [modalitiesList, setModalitiesList] = useState<Array<{ guid: string; externalcode: string; description: string }>>([])

  const presetsInitializedRef = useRef(false)
  const useDebounceSearch = useDebounce(searchTerm, 500)
  const { presets, isLoading: isLoadingPresets } = useImageFilterPresets()

  const { studies, total, isLoading: isLoadingStudies, refetch } = useStudiesByLocation({
    locationId: undefined,
    page,
    perPage,
    search: useDebounceSearch,
    columnFilters,
    dateRange,
    dateField,
    sortColumn,
    sortDirection,
  })

  const studyIuidsKey = useMemo(
    () => studies
      .map((study) => (study.study_iuid || "").trim())
      .filter((studyIuid) => studyIuid.length > 0)
      .sort()
      .join(","),
    [studies]
  )

  const applyActiveLinksState = useCallback((next: Record<string, { is_active: boolean; share_url?: string }>) => {
    setActiveLinksByStudy((prev) => {
      const prevKeys = Object.keys(prev)
      const nextKeys = Object.keys(next)

      if (prevKeys.length !== nextKeys.length) {
        return next
      }

      for (const key of nextKeys) {
        const prevItem = prev[key]
        const nextItem = next[key]

        if (!prevItem || !nextItem) {
          return next
        }

        if (Boolean(prevItem.is_active) !== Boolean(nextItem.is_active)) {
          return next
        }

        if ((prevItem.share_url || "") !== (nextItem.share_url || "")) {
          return next
        }
      }

      return prev
    })
  }, [])

  useEffect(() => {
    const fetchActiveLinks = async () => {
      try {
        const studyIuids = studyIuidsKey ? studyIuidsKey.split(",") : []

        if (studyIuids.length === 0) {
          applyActiveLinksState({})
          return
        }

        const params = new URLSearchParams({
          study_iuids: studyIuids.join(","),
        })

        const { data } = await api.get(`/general/viewer-share-links/active?${params.toString()}`)

        if (data?.success && data?.data && typeof data.data === "object") {
          applyActiveLinksState(data.data)
          return
        }

        applyActiveLinksState({})
      } catch {
        applyActiveLinksState({})
      }
    }

    fetchActiveLinks()
  }, [applyActiveLinksState, studyIuidsKey])

  const tableStudies = useMemo(
    () => studies.map((study) => {
      const activeInfo = study.study_iuid ? activeLinksByStudy[study.study_iuid] : undefined
      return {
        ...study,
        has_active_share_link: Boolean(activeInfo?.is_active && activeInfo?.share_url),
        active_share_url: activeInfo?.share_url || null,
      }
    }),
    [activeLinksByStudy, studies]
  )

  useEffect(() => {
    const fetchModalities = async () => {
      try {
        const { data } = await api.get("/config/modalities")
        if (data.success && Array.isArray(data.data)) {
          setModalitiesList(data.data)
        }
      } catch (error) {
        console.error("Error cargando modalidades:", error)
      }
    }

    fetchModalities()
  }, [])

  const applyPreset = useCallback((preset: ImageFilterPreset | null) => {
    if (!preset) {
      setSearchTerm("")
      setColumnFilters({})
      setSelectedModality("all")
      setDateRange("all")
      setDateField("arrival")
      setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
      setPerPage(10)
      setSortColumn("study_datetime")
      setSortDirection("desc")
      setShowFilters(true)
      setActivePresetId(null)
      setPage(1)
      return
    }

    const filters = preset.filters
    setSearchTerm(filters.search || "")
    setColumnFilters(filters.column_filters || {})
    setSelectedModality(filters.column_filters?.modality || "all")
    setDateRange(filters.date_range || "all")
    setDateField(filters.date_field || "arrival")
    setVisibleColumns(filters.visible_columns?.length ? filters.visible_columns : DEFAULT_VISIBLE_COLUMNS)
    setPerPage(filters.per_page || 10)
    setSortColumn(filters.sort_column || "study_datetime")
    setSortDirection(filters.sort_direction || "desc")
    setShowFilters(filters.filters_visible ?? true)
    setActivePresetId(preset.guid)
    setPage(1)
  }, [])

  useEffect(() => {
    if (!isLoadingPresets && !presetsInitializedRef.current) {
      presetsInitializedRef.current = true
      const activePreset = presets.find((preset) => preset.is_active)
      if (activePreset) {
        applyPreset(activePreset)
      }
    }
  }, [applyPreset, isLoadingPresets, presets])

  useEffect(() => {
    if (isMobile) setShowFilters(false)
  }, [isMobile])

  const getCurrentFilters = useCallback((): ImageFilterPresetFilters => ({
    scope: "imagenes",
    search: searchTerm,
    location_id: "",
    visible_columns: visibleColumns,
    per_page: perPage,
    sort_column: sortColumn,
    sort_direction: sortDirection,
    date_range: dateRange,
    date_field: dateField,
    filters_visible: showFilters,
    column_filters: columnFilters,
  }), [columnFilters, dateField, dateRange, perPage, searchTerm, showFilters, sortColumn, sortDirection, visibleColumns])

  const toggleColumn = useCallback((columnKey: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnKey)) {
        if (prev.length === 1) {
          toast.error("Debe mantener al menos una columna visible")
          return prev
        }
        return prev.filter((key) => key !== columnKey)
      }
      return [...prev, columnKey]
    })
  }, [])

  const handleViewDicom = useCallback((study: PacsStudy) => {
    if (!study.study_iuid) {
      toast.error("El estudio no tiene Study Instance UID")
      return
    }

    const authDataRaw = localStorage.getItem("authData")
    const token = authDataRaw ? JSON.parse(authDataRaw).access_token : null

    const toastId = toast.loading("Abriendo visor DICOM...")

    fetch("/api/general/viewer-url-by-iuid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ study_iuid: study.study_iuid }),
    })
      .then((res) => res.json())
      .then((data) => {
        toast.dismiss(toastId)
        if (data.success && data.data?.viewer_url) {
          window.open(data.data.viewer_url, "_blank")
        } else {
          toast.error(data.message || "No se pudo obtener la URL del visor")
        }
      })
      .catch(() => {
        toast.dismiss(toastId)
        toast.error("No se pudo abrir el visor DICOM")
      })
  }, [])

  const handleOpenShareDialog = useCallback((study: PacsStudy) => {
    if (!study.study_iuid) {
      toast.error("El estudio no tiene Study Instance UID")
      return
    }

    setSelectedStudyToShare(study)
    setShareReason("")
    setShareEmailEnabled(false)
    setSharePatientEmail("")
    setShareUrl("")
    setShareExpiresAt("")
    setShareDialogOpen(true)
  }, [])

  const handleGenerateShareLink = useCallback(async () => {
    if (!selectedStudyToShare?.study_iuid) {
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
          study_iuid: selectedStudyToShare.study_iuid,
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
  }, [selectedStudyToShare, shareReason, shareEmailEnabled, sharePatientEmail])

  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Enlace copiado al portapapeles")
    } catch {
      toast.error("No se pudo copiar el enlace")
    }
  }, [shareUrl])

  const handleOpenReassignModal = useCallback((study: PacsStudy) => {
    setSelectedStudyToReassign(study)
    setReassignModalOpen(true)
  }, [])

  const handleOpenEditModal = useCallback((study: PacsStudy) => {
    setSelectedStudyToEdit(study)
    setEditModalOpen(true)
  }, [])

  const handleModalityChange = useCallback((value: string) => {
    setSelectedModality(value)
    setPage(1)
    setColumnFilters((prev) => {
      if (value === "all") {
        const { modality, ...rest } = prev
        return rest
      }
      return { ...prev, modality: value }
    })
  }, [])

  const actions = useMemo(
    () => {
      const userPermissions = Array.isArray((authData?.user as any)?.permissions)
        ? ((authData?.user as any)?.permissions as string[])
        : []

      const hasWildcard = userPermissions.includes("*")
      const canViewImages = hasWildcard || userPermissions.includes("tabs.images.view") || userPermissions.includes("images.view")
      const canShareImages = hasWildcard || userPermissions.includes("images.share_link")
      const canReassign = hasWildcard || userPermissions.includes("patients.manage")

      return getImageActions(
        canViewImages ? handleViewDicom : undefined,
        canShareImages ? handleOpenShareDialog : undefined,
        canReassign ? handleOpenReassignModal : undefined,
        handleOpenEditModal
      )
    },
    [authData?.user, handleOpenShareDialog, handleViewDicom, handleOpenReassignModal, handleOpenEditModal]
  )
  const isLoading = isLoadingStudies
  const activeFilterCount = [
    searchTerm.trim(),
    selectedModality !== "all",
    dateRange !== "all",
    dateField !== "arrival",
    ...Object.entries(columnFilters)
      .filter(([key, value]) => key !== "modality" && value.trim())
      .map(([, value]) => value),
  ].filter(Boolean).length

  return (
    <MainLayout>
      <div className="page-dark-gradient z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg p-3 shadow-sm">
        <div className="hidden md:block">
          <DynamicBreadcrumb />
        </div>

        <div className="mb-4 hidden flex-col gap-3 md:flex lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-lg bg-brand-purple p-2">
              <ImageIcon className="h-4 w-4 text-white sm:h-5 sm:w-6" />
            </div>
            <h1 className="text-xl font-bold text-brand-purple dark:text-purple-400 sm:text-2xl">Imágenes DICOM</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:min-w-[420px] lg:justify-end">
          </div>
        </div>

        <div className="hidden md:block">
          <FilterPresetTabs
            activePresetId={activePresetId}
            onPresetChange={applyPreset}
            currentFilters={getCurrentFilters()}
            filtersVisible={showFilters}
            onToggleFilters={() => setShowFilters((prev) => !prev)}
            activeFilterCount={activeFilterCount}
          />
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-visible md:overflow-hidden">
            {showFilters && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowFilters(false)} aria-hidden="true" />}
            <div className={`fixed inset-y-0 left-0 z-50 w-[min(22rem,92vw)] overflow-y-auto bg-background p-3 pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl md:static md:w-auto md:overflow-visible md:bg-transparent md:p-0 md:pt-0 md:shadow-none ${showFilters ? "" : "pointer-events-none invisible"}`}>
              <div className="mb-2 flex items-center justify-between md:hidden">
                <span className="text-sm font-semibold text-foreground">Filtros</span>
                <button type="button" onClick={() => setShowFilters(false)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-accent" aria-label="Cerrar filtros">
                  <X className="h-5 w-5" />
                </button>
              </div>
            <div className="mb-3 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-[#2a2e32] sm:px-4 lg:flex-row">
              <div className="flex flex-1 flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Búsqueda</label>
                <InputSearch
                  searchTerm={searchTerm}
                  setSearchTerm={(value) => {
                    setSearchTerm(value)
                    setPage(1)
                  }}
                  placeholder="Paciente, ACC. Nº, UID..."
                />
              </div>

              <div className="hidden w-px self-stretch bg-gray-300 lg:block" />
              <div className="block h-px bg-gray-300 lg:hidden" />

              <div className="flex shrink-0 flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modalidad</span>
                <Select value={selectedModality} onValueChange={handleModalityChange}>
                  <SelectTrigger className="h-11 w-full text-sm dark:border-gray-600 dark:bg-gray-700 lg:h-10 lg:min-w-[130px]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {modalitiesList.map((m) => (
                      <SelectItem key={m.guid} value={m.externalcode}>
                        {m.externalcode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden w-px self-stretch bg-gray-300 lg:block" />
              <div className="block h-px bg-gray-300 lg:hidden" />

              <div className="flex shrink-0 flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fechas</span>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  <Select
                    value={dateField}
                    onValueChange={(value) => {
                      setDateField(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-11 w-full text-sm dark:border-gray-600 dark:bg-gray-700 lg:h-10 lg:min-w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arrival">Llegada</SelectItem>
                      <SelectItem value="study">Estudio</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={dateRange}
                    onValueChange={(value) => {
                      setDateRange(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-11 w-full text-sm dark:border-gray-600 dark:bg-gray-700 lg:h-10 lg:min-w-[140px]">
                      <SelectValue placeholder="Hace >" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo</SelectItem>
                      <SelectItem value="1d">Hoy</SelectItem>
                      <SelectItem value="3d">Últ 3 días</SelectItem>
                      <SelectItem value="7d">Últ 7 días</SelectItem>
                      <SelectItem value="14d">Últ 14 días</SelectItem>
                      <SelectItem value="1m">Últ 1 mes</SelectItem>
                      <SelectItem value="2m">Últ 2 meses</SelectItem>
                      <SelectItem value="3m">Últ 3 meses</SelectItem>
                      <SelectItem value="1y">Hace &gt; 1 año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-purple p-2 text-white transition-all hover:bg-purple-700 disabled:opacity-50 lg:h-auto lg:w-auto"
                  title="Refrescar"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>

        <TablaDynamic<PacsStudy>
            data={tableStudies}
            columns={imageColumns}
            allColumns={imageColumns}
            actions={actions}
            pagination={{
              page,
              pageSize: perPage,
              total,
            }}
            onPaginationChange={(newPage, newPageSize) => {
              setPage(newPage)
              setPerPage(newPageSize)
            }}
            perPageValue={perPage}
            onPerPageChange={(per) => {
              setPerPage(per)
              setPage(1)
            }}
            sortColumn={sortColumn}
            onSortChange={(col, dir) => {
              setSortColumn(col)
              setSortDirection(dir)
              setPage(1)
            }}
            sortDirection={sortDirection}
            loading={isLoading}
            serverSideFiltering
            onColumnFiltersChange={(filters) => {
              setColumnFilters(filters)
              setPage(1)
            }}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            mobileMode="cards"
          />

        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-white shadow-lg shadow-purple-950/40 ring-2 ring-white/20 md:hidden"
          aria-label="Abrir filtros"
          title="Filtros"
        >
          <SlidersHorizontal className="h-6 w-6" />
          {activeFilterCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-purple-950">{activeFilterCount}</span>}
        </button>

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
                <p><span className="font-semibold">Paciente:</span> {selectedStudyToShare?.patient_name || "-"}</p>
                <p><span className="font-semibold">Study UID:</span> {selectedStudyToShare?.study_iuid || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-reason">Motivo (opcional)</Label>
                <Input
                  id="share-reason"
                  placeholder="Ej: entrega de resultados al paciente"
                  value={shareReason}
                  onChange={(e) => setShareReason(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="share-email-toggle"
                    checked={shareEmailEnabled}
                    onCheckedChange={(checked) => {
                      setShareEmailEnabled(!!checked)
                      if (!checked) setSharePatientEmail("")
                    }}
                  />
                  <Label htmlFor="share-email-toggle" className="cursor-pointer">
                    Enviar enlace por email
                  </Label>
                </div>
                {shareEmailEnabled && (
                  <Input
                    id="share-patient-email"
                    type="email"
                    placeholder="destinatario@correo.com"
                    value={sharePatientEmail}
                    onChange={(e) => setSharePatientEmail(e.target.value)}
                    autoFocus
                  />
                )}
              </div>

              {shareUrl ? (
                <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                  <Label htmlFor="share-url">Enlace generado</Label>
                  <Input id="share-url" value={shareUrl} readOnly />
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Expira: {shareExpiresAt ? new Date(shareExpiresAt).toLocaleString() : "-"}
                  </p>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
                disabled={isGeneratingShareLink}
              >
                Cerrar
              </Button>
              {shareUrl ? (
                <Button onClick={handleCopyShareUrl}>Copiar enlace</Button>
              ) : (
                <Button
                  onClick={handleGenerateShareLink}
                  disabled={isGeneratingShareLink || (shareEmailEnabled && !sharePatientEmail.trim())}
                >
                  {isGeneratingShareLink ? "Generando..." : "Generar enlace"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ReasignarImagenModal
          open={reassignModalOpen}
          onOpenChange={setReassignModalOpen}
          study={selectedStudyToReassign}
          onSuccess={refetch}
        />

        <EditarEstudioModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          study={selectedStudyToEdit}
          onSuccess={refetch}
        />
      </div>
    </MainLayout>
  )
}
