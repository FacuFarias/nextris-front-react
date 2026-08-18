export interface FilterPresetFilters {
    search: string;
    listo_para_leer: boolean;
    ver_finalizados: boolean;
    asignados_a_mi: boolean;
    ver_sin_imagenes: boolean;
    ver_sin_orden?: boolean;
    study_group_id: string;
    modality_id: string;
    bodypart_id: string;
    visible_columns: string[];
    per_page: number;
    sort_column: string;
    sort_direction: "asc" | "desc";
    date_range: string;
    date_field: string;
    flag_filter: string;
    filters_visible: boolean;
}

export interface FilterPreset {
    guid: string;
    name: string;
    filters: FilterPresetFilters;
    sort_order: number;
    is_active: boolean;
    created_on: string;
    updated_on: string;
}
