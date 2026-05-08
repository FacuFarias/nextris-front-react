import { useQuery } from "@tanstack/react-query"

export interface PacsStudy {
  pk: number
  study_iuid: string
  study_desc: string | null
  study_datetime: string | null
  updated_time: string | null
  study_date: string | null
  study_time: string | null
  location_id: string | null
  patient_name: string
  accession_no: string | null
  is_linked: boolean
  modality: string | null
  sending_aet: string | null
  num_series: number
  num_instances: number
  has_active_share_link?: boolean
  active_share_url?: string | null
}

interface StudiesByLocationResponse {
  success: boolean
  data: {
    data: PacsStudy[]
    total: number
    page: number
    per_page: number
  }
}

interface UseStudiesByLocationParams {
  locationId: string | undefined
  page?: number
  perPage?: number
  search?: string
  columnFilters?: Record<string, string>
  dateRange?: string
  dateField?: string
  sortColumn?: string
  sortDirection?: "asc" | "desc"
}

export const useStudiesByLocation = ({
  locationId,
  page = 1,
  perPage = 10,
  search = "",
  columnFilters = {},
  dateRange = "all",
  dateField = "arrival",
  sortColumn = "study_datetime",
  sortDirection = "desc",
}: UseStudiesByLocationParams) => {
  const { data, isLoading, error, refetch } = useQuery<StudiesByLocationResponse>({
    queryKey: ["studies-by-location", locationId, page, perPage, search, sortColumn, sortDirection, columnFilters, dateRange, dateField],
    queryFn: async () => {
      if (!locationId) {
        return { success: true, data: { data: [], total: 0, page, per_page: perPage } }
      }

      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("per_page", String(perPage))
      if (search) params.set("search", search)
      if (dateRange) params.set("date_range", dateRange)
      if (dateField) params.set("date_field", dateField)
      if (sortColumn) params.set("sort_column", sortColumn)
      if (sortDirection) params.set("sort_direction", sortDirection)
      if (columnFilters.patient_name?.trim()) params.set("filter_patient_name", columnFilters.patient_name.trim())
      if (columnFilters.study_desc?.trim()) params.set("filter_study_desc", columnFilters.study_desc.trim())
      if (columnFilters.accession_no?.trim()) params.set("filter_accession_no", columnFilters.accession_no.trim())
      if (columnFilters.modality?.trim()) params.set("filter_modality", columnFilters.modality.trim())

      const authDataRaw = localStorage.getItem("authData")
      const token = authDataRaw ? JSON.parse(authDataRaw).access_token : null
      const response = await fetch(
        `/api/dicom/studies-by-location/${locationId}?${params}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return response.json()
    },
    enabled: Boolean(locationId),
  })

  return {
    studies: data?.data?.data || [],
    total: data?.data?.total || 0,
    isLoading,
    error,
    refetch,
  }
}
