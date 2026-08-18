import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import TablaDynamic from "@/components/TableDynamic"
import type { TableColumn } from "@/types/table"
import type { PacsStudy } from "../hooks/use-studies-by-location"

interface StudyTypeRow {
  guid: string
  code: string
  description: string
  studygroup: string
  bodypart: string
  modality: string
}

interface EditarEstudioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  study: PacsStudy | null
  onSuccess: () => void
}

const studyTypeColumns: TableColumn<StudyTypeRow>[] = [
  {
    key: "description",
    label: "DESCRIPCIÓN",
    className: "font-medium",
    sortable: true,
    filterable: true,
    render: (value: string) => (
      <div className="max-w-[220px] truncate" title={value || ""}>
        {value || "-"}
      </div>
    ),
  },
  {
    key: "code",
    label: "CÓDIGO",
    className: "w-[90px]",
    headerClassName: "w-[90px]",
    sortable: true,
    filterable: true,
    render: (value: string) => (
      <div className="max-w-[84px] truncate" title={value || ""}>
        {value || "-"}
      </div>
    ),
  },
  {
    key: "modality",
    label: "MODALIDAD",
    className: "w-[100px]",
    headerClassName: "w-[100px]",
    sortable: true,
    filterable: true,
  },
  {
    key: "bodypart",
    label: "PARTE DEL CUERPO",
    className: "w-[130px]",
    headerClassName: "w-[130px]",
    sortable: true,
    filterable: true,
    render: (value: string) => (
      <div className="max-w-[120px] truncate" title={value || ""}>
        {value || "-"}
      </div>
    ),
  },
  {
    key: "studygroup",
    label: "GRUPO",
    className: "w-[140px]",
    headerClassName: "w-[140px]",
    sortable: true,
    filterable: true,
    render: (value: string) => (
      <div className="max-w-[130px] truncate" title={value || ""}>
        {value || "-"}
      </div>
    ),
  },
]

export const EditarEstudioModal = ({ open, onOpenChange, study, onSuccess }: EditarEstudioModalProps) => {
  const [accessionNo, setAccessionNo] = useState("")
  const [studyDesc, setStudyDesc] = useState("")
  const [studyDate, setStudyDate] = useState("")
  const [studyTime, setStudyTime] = useState("")
  const [studytypeId, setStudytypeId] = useState("")
  const [studyTypes, setStudyTypes] = useState<StudyTypeRow[]>([])
  const [selectedStudyType, setSelectedStudyType] = useState<StudyTypeRow | null>(null)
  const [loadingStudyTypes, setLoadingStudyTypes] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)

  const isLinked = study?.is_linked ?? false

  const dicomDateToHtml = (dicomDate: string | null | undefined) => {
    if (!dicomDate || dicomDate.length < 8) return ""
    return `${dicomDate.slice(0, 4)}-${dicomDate.slice(4, 6)}-${dicomDate.slice(6, 8)}`
  }

  const dicomTimeToHtml = (dicomTime: string | null | undefined) => {
    if (!dicomTime || dicomTime.length < 4) return ""
    return `${dicomTime.slice(0, 2)}:${dicomTime.slice(2, 4)}`
  }

  const htmlDateToDicom = (htmlDate: string) => {
    return htmlDate.replace(/-/g, "")
  }

  const htmlTimeToDicom = (htmlTime: string) => {
    return `${htmlTime.replace(/:/g, "")}00.000`
  }

  useEffect(() => {
    if (open && study) {
      setAccessionNo(study.accession_no || "")
      setStudyDesc(study.study_desc || "")
      setStudyDate(dicomDateToHtml(study.study_date))
      setStudyTime(dicomTimeToHtml(study.study_time))
      setStudytypeId("")
      setStudyTypes([])
      setSelectedStudyType(null)
      setPage(1)
      setLoadingStudyTypes(false)
    }
  }, [open, study])

  useEffect(() => {
    if (open && study?.is_linked && study?.modality) {
      const controller = new AbortController()
      const loadStudyTypes = async () => {
        setLoadingStudyTypes(true)
        try {
          const { data } = await api.get("/config/study-types", {
            params: { modality_code: study.modality }
          })
          if (data.success) {
            const rows: StudyTypeRow[] = (data.data || []).map((st: StudyTypeRow) => st)
            setStudyTypes(rows)

            const { data: examData } = await api.get("/dicom/study-examination", {
              params: { study_iuid: study.study_iuid }
            })
            if (examData.success && examData.data?.studytype_id) {
              const current = rows.find((r: StudyTypeRow) => r.guid === examData.data.studytype_id)
              if (current) {
                setStudytypeId(examData.data.studytype_id)
                setSelectedStudyType(current)
              }
            }
          }
        } catch {
          toast.error("Error al cargar tipos de estudio")
        } finally {
          setLoadingStudyTypes(false)
        }
      }
      loadStudyTypes()
      return () => { controller.abort() }
    }
  }, [open, study])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen)
  }, [onOpenChange])

  const handleSave = useCallback(async () => {
    if (!study) return
    setIsSaving(true)
    try {
      const body: Record<string, string> = {}
      const originalDateHtml = dicomDateToHtml(study.study_date)
      const originalTimeHtml = dicomTimeToHtml(study.study_time)

      if (accessionNo !== (study.accession_no || "")) body.accession_no = accessionNo
      if (studyDate !== originalDateHtml) body.study_date = htmlDateToDicom(studyDate)
      if (studyTime !== originalTimeHtml) body.study_time = htmlTimeToDicom(studyTime)

      if (!isLinked) {
        if (studyDesc !== (study.study_desc || "")) body.study_desc = studyDesc
      }

      if (isLinked && studytypeId) {
        body.studytype_id = studytypeId
      }

      if (Object.keys(body).length === 0) {
        toast.info("No hay cambios para guardar")
        onOpenChange(false)
        return
      }

      const { data } = await api.put(`/dicom/studies/${study.pk}`, body)
      if (data.success) {
        toast.success("Estudio actualizado correctamente")
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.message || "No se pudo actualizar el estudio")
      }
    } catch {
      toast.error("Error al actualizar el estudio")
    } finally {
      setIsSaving(false)
    }
  }, [study, accessionNo, studyDesc, studyDate, studyTime, studytypeId, isLinked, onOpenChange, onSuccess])

  const handleRowClick = useCallback((row: StudyTypeRow) => {
    setStudytypeId(row.guid)
    setSelectedStudyType(row)
  }, [])

  if (!study) return null

  const pagination = {
    page,
    pageSize: perPage,
    total: studyTypes.length,
    serverSide: false,
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Editar estudio DICOM</DialogTitle>
          <DialogDescription>
            Modificar los metadatos del estudio en el PACS
            {isLinked && " y el tipo de estudio del examen vinculado"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-accession">Accession Number</Label>
            <Input
              id="edit-accession"
              value={accessionNo}
              onChange={(e) => setAccessionNo(e.target.value)}
              placeholder="ACC001"
            />
          </div>

          {isLinked ? (
            <div className="space-y-2">
              <Label>Tipo de estudio</Label>
              {loadingStudyTypes ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cargando tipos de estudio...
                </div>
              ) : (
                <TablaDynamic<StudyTypeRow>
                  data={studyTypes}
                  columns={studyTypeColumns}
                  rowIdKey="guid"
                  selectedRow={selectedStudyType}
                  onRowClick={handleRowClick}
                  onRowDoubleClick={handleRowClick}
                  pagination={pagination}
                  onPaginationChange={(newPage) => setPage(newPage)}
                  perPageValue={perPage}
                  onPerPageChange={(value) => { setPerPage(value); setPage(1) }}
                  maxHeight="300px"
                  compactSpacing
                  preserveTableHeight
                  emptyMessage={
                    study.modality
                      ? `No se encontraron tipos de estudio para la modalidad ${study.modality}`
                      : "No se encontraron tipos de estudio"
                  }
                />
              )}
              {selectedStudyType && (
                <p className="text-xs text-muted-foreground">
                  Seleccionado: <strong>{selectedStudyType.description}</strong>
                  {study.modality && <> &middot; Modalidad: {study.modality}</>}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción del estudio</Label>
              <Input
                id="edit-description"
                value={studyDesc}
                onChange={(e) => setStudyDesc(e.target.value)}
                placeholder="Torax"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-study-date">Fecha de estudio</Label>
              <Input
                id="edit-study-date"
                type="date"
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-study-time">Hora de estudio</Label>
              <Input
                id="edit-study-time"
                type="time"
                value={studyTime}
                onChange={(e) => setStudyTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || (isLinked && loadingStudyTypes)}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
