import type { EjecucionResponse, StudyTypeResponse } from '../types/ejecucion.type';
import { getEjecucion, getStudyTypes, updateExaminationStudyType } from '../services/ejecucion.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ejecucionKeys } from '../constants/query-keys';
import { toast } from 'sonner';

export const useEjecucion = () => {
    const queryClient = useQueryClient();
    
    const { data, isLoading, error, refetch } = useQuery<EjecucionResponse>({
        queryKey: ejecucionKeys.lists(),
        queryFn: () => getEjecucion(),
    });

    const { data: studyTypesData, isLoading: isLoadingStudyTypes } = useQuery<StudyTypeResponse>({
        queryKey: ['study-types'],
        queryFn: () => getStudyTypes(),
    });

    const updateStudyTypeMutation = useMutation({
        mutationFn: ({ examGuid, studyTypeId }: { examGuid: string; studyTypeId: string }) =>
            updateExaminationStudyType(examGuid, studyTypeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ejecucionKeys.lists() });
            toast.success('Tipo de estudio actualizado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Error al actualizar el tipo de estudio');
        },
    });

    return {
        ejecucionData: data,
        isLoading,
        error,
        refetchEjecucion: refetch,
        studyTypes: studyTypesData?.data || [],
        isLoadingStudyTypes,
        updateStudyType: updateStudyTypeMutation.mutate,
        isUpdatingStudyType: updateStudyTypeMutation.isPending,
    }
}