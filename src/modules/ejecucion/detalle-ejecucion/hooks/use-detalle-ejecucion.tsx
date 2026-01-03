import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDetalleEjecucion, postDetalleEjecucion } from '../services/detalle-ejecucion.service';
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