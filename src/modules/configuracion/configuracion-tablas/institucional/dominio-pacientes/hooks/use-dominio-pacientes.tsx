import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dominioPacientesKeys } from "../constants/query-keys";
import { dominioPacientesService } from "../services/dominio-pacientes.service";
import type { DominioPacienteFormData } from "../types/dominio-pacientes.types";

export const useDominioPacientes = () => {
    const queryClient = useQueryClient();

    const { data: dominioPacientes, isLoading, error } = useQuery({
        queryKey: dominioPacientesKeys.all,
        queryFn: dominioPacientesService.getAll,
        gcTime: 10 * 60 * 1000,
        staleTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: dominioPacientesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dominioPacientesKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DominioPacienteFormData> }) =>
            dominioPacientesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dominioPacientesKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: dominioPacientesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dominioPacientesKeys.all });
        },
    });

    return {
        dominioPacientes,
        isLoading,
        error,
        createDominioPaciente: createMutation.mutate,
        updateDominioPaciente: updateMutation.mutate,
        deleteDominioPaciente: deleteMutation.mutate,
    };
};
