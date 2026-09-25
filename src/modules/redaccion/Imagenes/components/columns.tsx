import type { TableColumn, TableAction } from "@/types/table"
import type { PacsStudy } from "../hooks/use-studies-by-location"
import { fechaYhora, formatDate } from "@/lib/fechaYhora"
import { Badge } from "@/components/ui/badge"
import { Check, Eye, Pencil, Share2, UserPen, X } from "lucide-react"
import { toast } from "sonner"
import { formatPatientName } from "@/lib/formatPatientName"

const formatStudyTime = (timeValue: string | null) => {
  if (!timeValue) return "—"
  const digits = timeValue.replace(/\D/g, "")
  if (digits.length < 4) return timeValue

  const hh = digits.slice(0, 2)
  const mm = digits.slice(2, 4)
  const ss = digits.length >= 6 ? digits.slice(4, 6) : "00"
  return `${hh}:${mm}:${ss}`
}

export const imageColumns: TableColumn<PacsStudy>[] = [
  {
    key: "patient_name",
    label: "PACIENTE",
    className: "font-medium",
    headerClassName: "w-[200px]",
    sortable: true,
    filterable: true,
    mobile: { role: "title", order: 1 },
    render: (value: string | null) => {
      const text = formatPatientName(value)
      return <span className="truncate block" title={text}>{text}</span>
    },
  },
  {
    key: "patient_id",
    label: "PATIENT ID",
    className: "font-medium",
    headerClassName: "w-[110px]",
    sortable: true,
    filterable: true,
    mobile: { label: "Patient ID", order: 4 },
    render: (value: string | null) => {
      const text = value || "—"
      return <span className="truncate block" title={text}>{text}</span>
    },
  },
  {
    key: "study_desc",
    label: "DESCRIPCIÓN",
    className: "font-medium",
    sortable: true,
    filterable: true,
    mobile: { label: "Descripción", order: 2 },
    render: (value: string | null) => {
      const text = value || "—"
      return <span className="truncate block" title={text}>{text}</span>
    },
  },
  {
    key: "accession_no",
    label: "ACC. Nº",
    className: "font-medium",
    headerClassName: "w-[100px]",
    sortable: true,
    filterable: true,
    mobile: { label: "Acceso", order: 3 },
    render: (value: string | null) => value || "—",
  },
  {
    key: "is_linked",
    label: "V",
    headerTitle: "VINCULADA",
    className: "font-medium text-center",
    headerClassName: "w-[45px]",
    sortable: true,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: boolean) => (
      <div className="flex justify-center" title={value ? "Vinculada" : "No vinculada"}>
        {value ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        )}
      </div>
    ),
  },
  {
    key: "has_studytype",
    label: "ST",
    headerTitle: "STUDY TYPE ASIGNADO",
    className: "font-medium text-center",
    headerClassName: "w-[45px]",
    sortable: true,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: boolean) => (
      <div className="flex justify-center" title={value ? "Study type asignado" : "Sin study type"}>
        {value ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        )}
      </div>
    ),
  },
  {
    key: "has_active_share_link",
    label: "LINK",
    className: "font-medium text-center",
    headerClassName: "w-[65px]",
    sortable: true,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: boolean | undefined, row: PacsStudy) => {
      const isActive = Boolean(value && row.active_share_url)

      if (!isActive) {
        return (
          <div className="flex justify-center">
            <X className="h-4 w-4 text-red-500" />
          </div>
        )
      }

      return (
        <div className="flex justify-center">
          <button
            type="button"
            title="Copiar link activo"
            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-emerald-500/10"
            onClick={async (event) => {
              event.stopPropagation()
              try {
                await navigator.clipboard.writeText(row.active_share_url as string)
                toast.success("Link copiado al portapapeles")
              } catch {
                toast.error("No se pudo copiar el link")
              }
            }}
          >
            <Check className="h-4 w-4 text-emerald-500" />
          </button>
        </div>
      )
    },
  },
  {
    key: "modality",
    label: "MODALIDAD",
    className: "font-medium",
    headerClassName: "w-[90px]",
    sortable: true,
    filterable: true,
    mobile: { label: "Modalidad", order: 5 },
    render: (value: string | null) => value || "—",
  },
  {
    key: "sending_aet",
    label: "AET",
    className: "font-medium",
    headerClassName: "w-[100px]",
    sortable: false,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: string | null) => value || "—",
  },
  {
    key: "num_series",
    label: "SERIES",
    className: "font-medium text-center",
    headerClassName: "w-[70px]",
    sortable: true,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: number) => (
      <div className="flex justify-center">
        <Badge variant="secondary">{value}</Badge>
      </div>
    ),
  },
  {
    key: "num_instances",
    label: "INS",
    className: "font-medium text-center",
    headerClassName: "w-[100px]",
    sortable: false,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: number) => (
      <div className="flex justify-center">
        <Badge>{value}</Badge>
      </div>
    ),
  },
  {
    key: "updated_time",
    label: "FECHA LLEGADA",
    className: "font-medium",
    sortable: true,
    filterable: false,
    mobile: { label: "Llegada", order: 6 },
    render: (value: string | null) => {
      if (!value) return <span className="text-gray-400 text-xs">—</span>
      return fechaYhora(value)
    },
  },
  {
    key: "study_date",
    label: "FECHA DE ESTUDIO",
    className: "font-medium",
    sortable: true,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: string | null) => {
      if (!value) return <span className="text-gray-400 text-xs">—</span>
      return formatDate(value)
    },
  },
  {
    key: "study_time",
    label: "HORA DE ESTUDIO",
    className: "font-medium",
    sortable: true,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: string | null) => formatStudyTime(value),
  },
  {
    key: "study_datetime",
    label: "FECHA Y HORA",
    className: "font-medium",
    sortable: true,
    filterable: false,
    mobile: { role: "hidden" },
    render: (value: string | null) => {
      if (!value) return <span className="text-gray-400 text-xs">—</span>
      return fechaYhora(value)
    },
  },
]

export const getImageActions = (
  onView?: (study: PacsStudy) => void,
  onShare?: (study: PacsStudy) => void,
  onReassign?: (study: PacsStudy) => void,
  onEdit?: (study: PacsStudy) => void
): TableAction<PacsStudy>[] => {
  const actions: TableAction<PacsStudy>[] = []

  if (onView) {
    actions.push({
      icon: <Eye className="h-4 w-4" />,
      label: "Ver imágenes",
      onClick: (study) => onView(study),
      variant: "default",
      mobilePrimary: true,
    })
  }

  if (onEdit) {
    actions.push({
      icon: <Pencil className="h-4 w-4" />,
      label: "Editar",
      onClick: (study) => onEdit(study),
      variant: "secondary",
    })
  }

  if (onShare) {
    actions.push({
      icon: <Share2 className="h-4 w-4" />,
      label: "Compartir enlace",
      onClick: (study) => onShare(study),
      variant: "secondary",
    })
  }

  if (onReassign) {
    actions.push({
      icon: <UserPen className="h-4 w-4" />,
      label: "Reasignar a otro paciente",
      onClick: (study) => onReassign(study),
      variant: "secondary",
    })
  }

  return actions
}
