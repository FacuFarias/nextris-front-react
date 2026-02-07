
import type { EstudiosNoVinculados } from '../types/cargar-estudios.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUnlinkedStudies, uploadFiles } from '../services/cargar-estudios.service';
import { cargarEstudiosKeys } from '../constants/query-keys';

export const useCargarEstudios = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ file, location_id }: { file: File, location_id: string }) => {
            const response = await uploadFiles(file, location_id);
            return response;
        },
        onSuccess: (data) => {
            console.log('Uploaded file:', data);
            queryClient.invalidateQueries({ queryKey: cargarEstudiosKeys.listNoVinculados() });
        },
        onError: (error) => {
            console.error('Error al subir archivo:', error);
        },
    });
    return mutation;
}

export const useEstudiosNoVinculados = ({ location_id }: { location_id: string }) => {

    const { data, isLoading, error, refetch } = useQuery<EstudiosNoVinculados>({
        queryKey: cargarEstudiosKeys.listNoVinculados(),
        queryFn: () => getUnlinkedStudies({ location_id }),
        enabled: !!location_id,
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });
    return {
        estudiosNoVinculadosData: data,
        isLoading,
        error,
        refetchEstudiosNoVinculados: refetch,
    }
}
