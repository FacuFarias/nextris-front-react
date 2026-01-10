import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { physicianScheduleService } from '../services/physician-schedules.service';
import type { PhysicianScheduleFormData } from '../types/physician-schedules.types';
import { physicianScheduleKeys } from '../constants/query-keys';

export const usePhysicianSchedules = (physicianId?: string, locationId?: string) => {
    const queryClient = useQueryClient();

    const filterKey = `${physicianId || 'all'}-${locationId || 'all'}`;

    const { data: schedules, isLoading, error } = useQuery({
        queryKey: physicianScheduleKeys.list(filterKey),
        queryFn: () => physicianScheduleService.getAll(physicianId, locationId),
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: physicianScheduleService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: physicianScheduleKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PhysicianScheduleFormData> }) =>
            physicianScheduleService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: physicianScheduleKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: physicianScheduleService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: physicianScheduleKeys.all });
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
