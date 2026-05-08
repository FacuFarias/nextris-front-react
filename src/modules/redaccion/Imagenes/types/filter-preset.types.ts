export interface ImageFilterPresetFilters {
  scope: "imagenes"
  search: string
  location_id: string
  visible_columns: string[]
  per_page: number
  sort_column: string
  sort_direction: "asc" | "desc"
  date_range: string
  date_field: string
  filters_visible: boolean
  column_filters: Record<string, string>
}

export interface ImageFilterPreset {
  guid: string
  name: string
  filters: ImageFilterPresetFilters
  sort_order: number
  is_active: boolean
  created_on: string
  updated_on: string
}
