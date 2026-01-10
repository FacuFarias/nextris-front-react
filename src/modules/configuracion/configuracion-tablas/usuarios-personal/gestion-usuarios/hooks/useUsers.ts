import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, roleService } from '../services/users.service';
import type { UserFormData } from '../types/users.types';
import { userKeys, roleKeys } from '../constants/query-keys';

export const useUsers = (includeInactive: boolean = false) => {
    const queryClient = useQueryClient();

    const { data: users, isLoading, error } = useQuery({
        queryKey: userKeys.list(includeInactive ? 'inactive' : 'active'),
        queryFn: () => userService.getAll(includeInactive),
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: userService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) =>
            userService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    const activateMutation = useMutation({
        mutationFn: userService.activate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    const deactivateMutation = useMutation({
        mutationFn: userService.deactivate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
            userService.resetPassword(id, newPassword),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });

    return {
        users,
        isLoading,
        error,
        createUser: createMutation.mutate,
        updateUser: updateMutation.mutate,
        deleteUser: deleteMutation.mutate,
        activateUser: activateMutation.mutate,
        deactivateUser: deactivateMutation.mutate,
        resetPassword: resetPasswordMutation.mutate,
    };
};

export const useRoles = () => {
    const { data: roles, isLoading, error } = useQuery({
        queryKey: roleKeys.all,
        queryFn: () => roleService.getAll(),
        staleTime: 30 * 60 * 1000, // Los roles cambian poco, cache por 30 min
        gcTime: 30 * 60 * 1000,
    });

    return {
        roles,
        isLoading,
        error,
    };
};
