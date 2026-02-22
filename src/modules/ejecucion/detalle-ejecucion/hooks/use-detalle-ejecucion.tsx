import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDetalleEjecucion, getExecutionAllTags, postDetalleEjecucion, updateExecutionFlags, updateExecutionTagIds } from '../services/detalle-ejecucion.service';
import { ejecucionKeys } from '../../constants/query-keys';
import type { DetalleEjecucionRequest, DetalleEjecucionResponse } from '../types/detalle-ejecucion.type';
import { toast } from 'sonner';

export const useDetalleEjecucion = (guid: string) => {
    const { data, isLoading, error, refetch } = useQuery<DetalleEjecucionResponse>({
        queryKey: ejecucionKeys.detail(guid),
        queryFn: () => getDetalleEjecucion(guid),
        enabled: !!guid, // Solo ejecuta la query si hay guid
    });

    return {
        detalleData: data,
        isLoading,
        error,
        refetchDetalle: refetch,
    };
};


export const useDetalleEjecucionPost = (guid: string, onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    const { mutate, error, isPending } = useMutation<DetalleEjecucionResponse, Error, DetalleEjecucionRequest>({
        mutationFn: (data: DetalleEjecucionRequest) => postDetalleEjecucion(data, guid),
        onSuccess: () => {
            toast.success('Detalle de ejecución enviado con éxito', {
                duration: 4000,
                position: 'top-right',
            });
            queryClient.invalidateQueries({ queryKey: ejecucionKeys.detail(guid) });
            queryClient.invalidateQueries({ queryKey: ejecucionKeys.lists() });

            // Ejecutar el callback si existe
            if (onSuccessCallback) {
                onSuccessCallback();
            }
        },
        onError: (error) => {
            console.log('Error:', error);
            toast.error(error.message || 'Error enviando el detalle de ejecución', {
                duration: 4000,
                position: 'top-right',
            });
        },
    });

    return {
        error,
        postDetalleEjecucion: mutate,
        isLoading: isPending,
    };
};

export const useDetalleEjecucionUpdateFlags = (guid: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (flags: string[]) => updateExecutionFlags(guid, flags),
        onMutate: async (flags) => {
            await queryClient.cancelQueries({ queryKey: ejecucionKeys.detail(guid) });
            const previousDetail = queryClient.getQueryData(ejecucionKeys.detail(guid));

            queryClient.setQueryData(ejecucionKeys.detail(guid), (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        flags,
                    },
                };
            });

            return { previousDetail };
        },
        onError: (error: any, _variables, context: any) => {
            if (context?.previousDetail) {
                queryClient.setQueryData(ejecucionKeys.detail(guid), context.previousDetail);
            }
            toast.error(error.response?.data?.message || 'Error al actualizar banderas');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ejecucionKeys.detail(guid) });
        },
    });
};

export const useDetalleEjecucionUpdateTagIds = (guid: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tagIds: string[]) => updateExecutionTagIds(guid, tagIds),
        onMutate: async (tagIds) => {
            await queryClient.cancelQueries({ queryKey: ejecucionKeys.detail(guid) });
            const previousDetail = queryClient.getQueryData(ejecucionKeys.detail(guid));

            queryClient.setQueryData(ejecucionKeys.detail(guid), (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        tag_ids: tagIds,
                    },
                };
            });

            return { previousDetail };
        },
        onError: (error: any, _variables, context: any) => {
            if (context?.previousDetail) {
                queryClient.setQueryData(ejecucionKeys.detail(guid), context.previousDetail);
            }
            toast.error(error.response?.data?.message || 'Error al actualizar tags');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ejecucionKeys.detail(guid) });
        },
    });
};

export const useDetalleEjecucionAllTags = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['tags', 'all'],
        queryFn: getExecutionAllTags,
        staleTime: 5 * 60 * 1000,
    });

    return {
        allTags: data?.data ?? [],
        isLoading,
    };
};