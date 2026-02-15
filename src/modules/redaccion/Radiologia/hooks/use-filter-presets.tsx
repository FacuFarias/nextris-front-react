import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { filterPresetKeys } from "../constants/query-keys"
import {
    getFilterPresets,
    createFilterPreset,
    updateFilterPreset,
    deleteFilterPreset,
    activateFilterPreset,
    deactivateAllFilterPresets,
} from "../services/filter-presets.service"
import type { FilterPreset, FilterPresetFilters } from "../types/filter-preset.types"
import { toast } from "sonner"

export const useFilterPresets = () => {
    const { data, isLoading, error } = useQuery<{ success: boolean; data: FilterPreset[] }>({
        queryKey: filterPresetKeys.list(),
        queryFn: getFilterPresets,
    })

    return {
        presets: data?.data ?? [],
        isLoading,
        error,
    }
}

export const useCreateFilterPreset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { name: string; filters: FilterPresetFilters }) => createFilterPreset(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: filterPresetKeys.list() })
            toast.success(response.message || "Preset creado exitosamente")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al crear el preset")
        },
    })
}

export const useUpdateFilterPreset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ guid, data }: { guid: string; data: { name?: string; filters?: FilterPresetFilters } }) =>
            updateFilterPreset(guid, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: filterPresetKeys.list() })
            toast.success(response.message || "Preset actualizado exitosamente")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al actualizar el preset")
        },
    })
}

export const useDeleteFilterPreset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (guid: string) => deleteFilterPreset(guid),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: filterPresetKeys.list() })
            toast.success(response.message || "Preset eliminado exitosamente")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al eliminar el preset")
        },
    })
}

export const useActivateFilterPreset = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (guid: string) => activateFilterPreset(guid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: filterPresetKeys.list() })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al activar el preset")
        },
    })
}

export const useDeactivateAllPresets = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => deactivateAllFilterPresets(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: filterPresetKeys.list() })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al desactivar presets")
        },
    })
}
