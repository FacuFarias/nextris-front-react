import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import TablaDynamic from "@/components/TableDynamic"
import { MainLayout } from "@/layouts/layout"
import { useDebounce } from "@uidotdev/usehooks"
import { Image as ImageIcon, Loader2, RefreshCcw } from "lucide-react"
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
import { useImageFilterPresets } from "./hooks/use-filter-presets"
import { useStudiesByLocation } from "./hooks/use-studies-by-location"
import type { PacsStudy } from "./hooks/use-studies-by-location"
import type { ImageFilterPreset, ImageFilterPresetFilters } from "./types/filter-preset.types"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"

const DEFAULT_VISIBLE_COLUMNS = imageColumns.map((col) => col.key as string)

export const Imagenes = () => {
  const { authData } = useAuth()
  const [locationId, setLocationId] = useState<string | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [dateRange, setDateRange] = useState<string>("all")
  const [dateField, setDateField] = useState<string>("arrival")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortColumn, setSortColumn] = useState("study_datetime")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS)
  const [showFilters, setShowFilters] = useState(true)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Array<{ guid: string; name: string }>>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareReason, setShareReason] = useState("")
  const [shareEmailEnabled, setShareEmailEnabled] = useState(false)
  const [sharePatientEmail, setSharePatientEmail] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [shareExpiresAt, setShareExpiresAt] = useState("")
  const [selectedStudyToShare, setSelectedStudyToShare] = useState<PacsStudy | null>(null)
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false)
  const [activeLinksByStudy, setActiveLinksByStudy] = useState<Record<string, { is_active: boolean; share_url?: string }>>({})

  const presetsInitializedRef = useRef(false)
  const useDebounceSearch = useDebounce(searchTerm, 500)
  const { presets, isLoading: isLoadingPresets } = useImageFilterPresets()

  const { studies, total, isLoading: isLoadingStudies, refetch } = useStudiesByLocation({
    locationId,
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
    const fetchLocations = async () => {
      try {
        const { data } = await api.get("/user/locations")
        if (data.success && Array.isArray(data.data)) {
          setLocations(data.data)
          setLocationId((prev) => {
            if (prev && data.data.some((loc: { guid: string }) => loc.guid === prev)) {
              return prev
            }
            return data.data[0]?.guid
          })
        } else {
          setLocations([])
          setLocationId(undefined)
        }
      } catch (error) {
        console.error("Error cargando locations:", error)
        toast.error("No se pudieron cargar las ubicaciones")
        setLocations([])
        setLocationId(undefined)
      } finally {
        setIsLoadingLocations(false)
      }
    }

    fetchLocations()
  }, [])

  const applyPreset = useCallback((preset: ImageFilterPreset | null) => {
    if (!preset) {
      setSearchTerm("")
      setColumnFilters({})
      setDateRange("all")
      setDateField("arrival")
      setLocationId(undefined)
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
    setDateRange(filters.date_range || "all")
    setDateField(filters.date_field || "arrival")
    setLocationId(filters.location_id || undefined)
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

  const getCurrentFilters = useCallback((): ImageFilterPresetFilters => ({
    scope: "imagenes",
    search: searchTerm,
    location_id: locationId || "",
    visible_columns: visibleColumns,
    per_page: perPage,
    sort_column: sortColumn,
    sort_direction: sortDirection,
    date_range: dateRange,
    date_field: dateField,
    filters_visible: showFilters,
    column_filters: columnFilters,
  }), [columnFilters, dateField, dateRange, locationId, perPage, searchTerm, showFilters, sortColumn, sortDirection, visibleColumns])

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

    const viewerWindow = window.open("", "_blank", "width=1400,height=900,resizable=yes,scrollbars=yes")
    if (!viewerWindow) {
      toast.error("Por favor, permite popups para abrir el visor DICOM")
      return
    }

    viewerWindow.document.write(
      '<html><head><title>Cargando visor DICOM...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#fff"><p>Abriendo visor DICOM...</p></body></html>'
    )

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
        if (data.success && data.data?.viewer_url) {
          viewerWindow.location.href = data.data.viewer_url
        } else {
          viewerWindow.close()
          toast.error(data.message || "No se pudo obtener la URL del visor")
        }
      })
      .catch(() => {
        viewerWindow.close()
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
          expires_hours: 24,
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

  const actions = useMemo(
    () => {
      const userPermissions = Array.isArray((authData?.user as any)?.permissions)
        ? ((authData?.user as any)?.permissions as string[])
        : []

      const hasWildcard = userPermissions.includes("*")
      const canViewImages = hasWildcard || userPermissions.includes("tabs.images.view") || userPermissions.includes("images.view")
      const canShareImages = hasWildcard || userPermissions.includes("images.share_link")

      return getImageActions(
        canViewImages ? handleViewDicom : undefined,
        canShareImages ? handleOpenShareDialog : undefined
      )
    },
    [authData?.user, handleOpenShareDialog, handleViewDicom]
  )
  const isLoading = isLoadingLocations || isLoadingStudies

  return (
    <MainLayout>
      <div className="page-dark-gradient z-10 flex h-full flex-col overflow-hidden rounded-lg p-3 shadow-sm sm:p-3">
        <DynamicBreadcrumb />

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-lg bg-brand-purple p-2">
              <ImageIcon className="h-4 w-4 text-white sm:h-5 sm:w-6" />
            </div>
            <h1 className="text-xl font-bold text-brand-purple dark:text-purple-400 sm:text-2xl">Imágenes DICOM</h1>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:min-w-[420px] lg:justify-end">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ubicación</span>
            <div className="w-full sm:w-[340px]">
              <Select
                value={locationId || ""}
                onValueChange={(value) => {
                  setLocationId(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-10 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-[#2a2e32]">
                  <SelectValue placeholder="Seleccionar ubicación..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.guid} value={loc.guid}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <FilterPresetTabs
          activePresetId={activePresetId}
          onPresetChange={applyPreset}
          currentFilters={getCurrentFilters()}
          filtersVisible={showFilters}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
        />

        <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="mb-3 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-[#2a2e32] sm:flex-row">
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

              <div className="hidden self-stretch bg-gray-300 sm:block sm:w-px" />
              <div className="block h-px bg-gray-300 sm:hidden" />

              <div className="flex shrink-0 flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fechas</span>
                <div className="flex gap-2">
                  <Select
                    value={dateField}
                    onValueChange={(value) => {
                      setDateField(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-10 min-w-[130px] text-sm dark:border-gray-600 dark:bg-gray-700">
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
                    <SelectTrigger className="h-10 min-w-[140px] text-sm dark:border-gray-600 dark:bg-gray-700">
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
                  className="rounded-lg bg-brand-purple p-2 text-white transition-all hover:bg-purple-700 disabled:opacity-50"
                  title="Refrescar"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {!locationId ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              <p>Por favor, selecciona una ubicación para ver los estudios</p>
            </div>
          ) : (
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
            />
          )}
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
      </div>
    </MainLayout>
  )
}
