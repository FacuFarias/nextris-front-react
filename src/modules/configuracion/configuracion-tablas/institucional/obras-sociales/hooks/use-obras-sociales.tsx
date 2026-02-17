import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obrasSocialesKeys } from "../constants/query-keys";
import { obrasSocialesService } from "../services/obras-sociales.service";
import type { ObraSocialFormData } from "../types/obras-sociales.types";

export const useObrasSociales = () => {
    const queryClient = useQueryClient();

    const { data: obrasSociales, isLoading, error } = useQuery({
        queryKey: obrasSocialesKeys.all,
        queryFn: obrasSocialesService.getAll,
        gcTime: 10 * 60 * 1000,
        staleTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: obrasSocialesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: obrasSocialesKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ObraSocialFormData> }) =>
            obrasSocialesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: obrasSocialesKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: obrasSocialesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: obrasSocialesKeys.all });
        },
    });

    return {
        obrasSociales,
        isLoading,
        error,
        createObraSocial: createMutation.mutate,
        updateObraSocial: updateMutation.mutate,
        deleteObraSocial: deleteMutation.mutate,
    };
};

export const useInsuranceLocations = (insuranceId: string | null) => {
    const queryClient = useQueryClient();

    const { data: assignedLocations, isLoading } = useQuery({
        queryKey: obrasSocialesKeys.locations(insuranceId || ""),
        queryFn: () => obrasSocialesService.getLocations(insuranceId!),
        enabled: !!insuranceId,
        gcTime: 5 * 60 * 1000,
        staleTime: 5 * 60 * 1000,
    });

    const setLocationsMutation = useMutation({
        mutationFn: ({ insuranceId, locationIds }: { insuranceId: string; locationIds: string[] }) =>
            obrasSocialesService.setLocations(insuranceId, locationIds),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: obrasSocialesKeys.locations(variables.insuranceId) });
        },
    });

    return {
        assignedLocations,
        isLoading,
        setLocations: setLocationsMutation.mutate,
        isSaving: setLocationsMutation.isPending,
    };
};
