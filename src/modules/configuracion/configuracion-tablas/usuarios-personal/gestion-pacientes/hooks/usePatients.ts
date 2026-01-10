import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patients.service';
import type { PatientFormData } from '../types/patients.types';
import { patientKeys } from '../constants/query-keys';

export const usePatients = (includeInactive: boolean = false) => {
    const queryClient = useQueryClient();

    const { data: patients, isLoading, error } = useQuery({
        queryKey: patientKeys.list(includeInactive ? 'inactive' : 'active'),
        queryFn: () => patientService.getAll(includeInactive),
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
        isLoading,
        error,
        createPatient: createMutation.mutate,
        updatePatient: updateMutation.mutate,
        deletePatient: deleteMutation.mutate,
        resetPassword: resetPasswordMutation.mutate,
    };
};
