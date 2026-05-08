import type { TableColumn, TableAction } from "@/types/table"
import type { PacsStudy } from "../hooks/use-studies-by-location"
import { fechaYhora } from "@/lib/fechaYhora"
import { formatDate } from "@/lib/fechaYhora"
import { Badge } from "@/components/ui/badge"
import { Check, Eye, Share2, X } from "lucide-react"
import { toast } from "sonner"

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
  },
  {
    key: "study_desc",
    label: "DESCRIPCIÓN",
    className: "font-medium",
    headerClassName: "max-w-[300px]",
    sortable: true,
    filterable: true,
    render: (value: string | null) => {
      return <span className="truncate">{value || "—"}</span>
    },
  },
  {
    key: "accession_no",
    label: "ACC. Nº",
    className: "font-medium",
    headerClassName: "w-[100px]",
    sortable: true,
    filterable: true,
    render: (value: string | null) => value || "—",
  },
  {
    key: "is_linked",
    label: "VINCULADA",
    className: "font-medium text-center",
    headerClassName: "w-[95px]",
    sortable: true,
    filterable: false,
    render: (value: boolean) => (
      <div className="flex justify-center">
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
    label: "LINK ACTIVO",
    className: "font-medium text-center",
    headerClassName: "w-[110px]",
    sortable: true,
    filterable: false,
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
    render: (value: string | null) => value || "—",
  },
  {
    key: "sending_aet",
    label: "AET",
    className: "font-medium",
    headerClassName: "w-[100px]",
    sortable: false,
    filterable: false,
    render: (value: string | null) => value || "—",
  },
  {
    key: "num_series",
    label: "SERIES",
    className: "font-medium text-center",
    headerClassName: "w-[70px]",
    sortable: true,
    filterable: false,
    render: (value: number) => (
      <div className="flex justify-center">
        <Badge variant="secondary">{value}</Badge>
      </div>
    ),
  },
  {
    key: "num_instances",
    label: "INSTANCIAS",
    className: "font-medium text-center",
    headerClassName: "w-[100px]",
    sortable: false,
    filterable: false,
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
    render: (value: string | null) => formatStudyTime(value),
  },
  {
    key: "study_datetime",
    label: "FECHA Y HORA",
    className: "font-medium",
    sortable: true,
    filterable: false,
    render: (value: string | null) => {
      if (!value) return <span className="text-gray-400 text-xs">—</span>
      return fechaYhora(value)
    },
  },
]

export const getImageActions = (
  onView?: (study: PacsStudy) => void,
  onShare?: (study: PacsStudy) => void
): TableAction<PacsStudy>[] => {
  const actions: TableAction<PacsStudy>[] = []

  if (onView) {
    actions.push({
      icon: <Eye className="h-4 w-4" />,
      label: "Ver imágenes",
      onClick: (study) => onView(study),
      variant: "default",
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

  return actions
}
