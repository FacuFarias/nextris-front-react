import { api } from "@/lib/api"
import type { ImageFilterPresetFilters } from "../types/filter-preset.types"

const SCOPE = "imagenes"

export const getImageFilterPresets = async () => {
  const response = await api.get(`/filter-presets?scope=${SCOPE}`)
  return response.data
}

export const createImageFilterPreset = async (data: { name: string; filters: ImageFilterPresetFilters }) => {
  const response = await api.post("/filter-presets", { ...data, scope: SCOPE })
  return response.data
}

export const updateImageFilterPreset = async (guid: string, data: { name?: string; filters?: ImageFilterPresetFilters }) => {
  const response = await api.put(`/filter-presets/${guid}`, data)
  return response.data
}

export const deleteImageFilterPreset = async (guid: string) => {
  const response = await api.delete(`/filter-presets/${guid}`)
  return response.data
}

export const activateImageFilterPreset = async (guid: string) => {
  const response = await api.put(`/filter-presets/${guid}/activate?scope=${SCOPE}`)
  return response.data
}

export const deactivateAllImageFilterPresets = async () => {
  const response = await api.put(`/filter-presets/deactivate-all?scope=${SCOPE}`)
  return response.data
}
