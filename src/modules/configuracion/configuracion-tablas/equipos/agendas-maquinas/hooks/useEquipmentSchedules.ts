import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentScheduleService } from '../services/equipment-schedules.service';
import type { EquipmentScheduleFormData } from '../types/equipment-schedules.types';
import { equipmentScheduleKeys } from '../constants/query-keys';

export const useEquipmentSchedules = (equipmentId?: string) => {
    const queryClient = useQueryClient();

    const { data: schedules, isLoading, error } = useQuery({
        queryKey: equipmentScheduleKeys.list(equipmentId || ''),
        queryFn: () => equipmentScheduleService.getAll(equipmentId),
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: equipmentScheduleService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentScheduleKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<EquipmentScheduleFormData> }) =>
            equipmentScheduleService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentScheduleKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: equipmentScheduleService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: equipmentScheduleKeys.all });
        },
    });

    return {
        schedules,
        isLoading,
        error,
        createSchedule: createMutation.mutate,
        updateSchedule: updateMutation.mutate,
        deleteSchedule: deleteMutation.mutate,
    };
};
