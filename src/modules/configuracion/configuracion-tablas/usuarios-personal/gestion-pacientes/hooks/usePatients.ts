import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patients.service';
import type { PatientFormData, PatientListParams } from '../types/patients.types';
import { patientKeys } from '../constants/query-keys';

export const usePatients = (params: PatientListParams) => {
    const queryClient = useQueryClient();

    const { data: patients, isFetching, isPlaceholderData, error } = useQuery({
        queryKey: patientKeys.list(params),
        queryFn: ({ signal }) => patientService.getAll(params, signal),
        placeholderData: keepPreviousData,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: patientService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: patientKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PatientFormData> }) =>
            patientService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: patientKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: patientService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: patientKeys.all });
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
            patientService.resetPassword(id, newPassword),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: patientKeys.all });
        },
    });

    return {
        patients,
        isLoading: isFetching,
        isPlaceholderData,
        error,
        createPatient: createMutation.mutate,
        updatePatient: updateMutation.mutate,
        deletePatient: deleteMutation.mutate,
        resetPassword: resetPasswordMutation.mutate,
    };
};
