import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reasignacionExamenesKeys } from '../constants/query-keys';
import { reasignacionExamenesService } from '../services/reasignacion-examenes.service';

export const useReasignacionExamenes = () => {
    const { data: estudios, isLoading, error } = useQuery({
        queryKey: reasignacionExamenesKeys.lists(),
        queryFn: () => reasignacionExamenesService.getAllEstudios(),
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });


    return {
        estudios,
        isLoading,
        error,
    };
}


export const useReasignacionExamenesPacientes = () => {
    const { data: estudiosPacientes, isLoading, error } = useQuery({
        queryKey: reasignacionExamenesKeys.listsPacientes(),
        queryFn: () => reasignacionExamenesService.getAllPacientes(),
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });


    return {
        estudiosPacientes,
        isLoading,
        error,
    };
}

export const usePostReasignacionExamenes = () => {

    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: reasignacionExamenesService.postReasignacion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reasignacionExamenesKeys.postPacientes() });
        },
    });
    return {
        createMutation,
    };
}