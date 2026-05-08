import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { imageFilterPresetKeys } from "../constants/query-keys"
import {
  activateImageFilterPreset,
  createImageFilterPreset,
  deactivateAllImageFilterPresets,
  deleteImageFilterPreset,
  getImageFilterPresets,
  updateImageFilterPreset,
} from "../services/filter-presets.service"
import type { ImageFilterPreset, ImageFilterPresetFilters } from "../types/filter-preset.types"

export const useImageFilterPresets = () => {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: ImageFilterPreset[] }>({
    queryKey: imageFilterPresetKeys.list(),
    queryFn: getImageFilterPresets,
  })

  return {
    presets: data?.data ?? [],
    isLoading,
    error,
  }
}

export const useCreateImageFilterPreset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; filters: ImageFilterPresetFilters }) => createImageFilterPreset(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: imageFilterPresetKeys.list() })
      toast.success(response.message || "Preset creado exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al crear el preset")
    },
  })
}

export const useUpdateImageFilterPreset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ guid, data }: { guid: string; data: { name?: string; filters?: ImageFilterPresetFilters } }) =>
      updateImageFilterPreset(guid, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: imageFilterPresetKeys.list() })
      toast.success(response.message || "Preset actualizado exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al actualizar el preset")
    },
  })
}

export const useDeleteImageFilterPreset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (guid: string) => deleteImageFilterPreset(guid),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: imageFilterPresetKeys.list() })
      toast.success(response.message || "Preset eliminado exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar el preset")
    },
  })
}

export const useActivateImageFilterPreset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (guid: string) => activateImageFilterPreset(guid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageFilterPresetKeys.list() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al activar el preset")
    },
  })
}

export const useDeactivateAllImagePresets = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deactivateAllImageFilterPresets(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageFilterPresetKeys.list() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al desactivar presets")
    },
  })
}
