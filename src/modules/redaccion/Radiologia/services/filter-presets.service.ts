import { api } from "@/lib/api"
import type { FilterPresetFilters } from "../types/filter-preset.types"

export const getFilterPresets = async () => {
    const response = await api.get("/filter-presets")
    return response.data
}

export const createFilterPreset = async (data: { name: string; filters: FilterPresetFilters }) => {
    const response = await api.post("/filter-presets", data)
    return response.data
}

export const updateFilterPreset = async (guid: string, data: { name?: string; filters?: FilterPresetFilters }) => {
    const response = await api.put(`/filter-presets/${guid}`, data)
    return response.data
}

export const deleteFilterPreset = async (guid: string) => {
    const response = await api.delete(`/filter-presets/${guid}`)
    return response.data
}

export const activateFilterPreset = async (guid: string) => {
    const response = await api.put(`/filter-presets/${guid}/activate`)
    return response.data
}

export const deactivateAllFilterPresets = async () => {
    const response = await api.put("/filter-presets/deactivate-all")
    return response.data
}
