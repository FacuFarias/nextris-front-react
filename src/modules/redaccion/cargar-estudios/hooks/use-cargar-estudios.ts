
import type { EstudiosNoVinculados, SearchExams } from '../types/cargar-estudios.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSearchExams, getUnlinkedStudies, postVinculacion, uploadFiles } from '../services/cargar-estudios.service';
import { cargarEstudiosKeys } from '../constants/query-keys';
import { toast } from 'sonner';

export const useCargarEstudios = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ file, location_id }: { file: File, location_id: string }) => {
            const response = await uploadFiles(file, location_id);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...cargarEstudiosKeys.all, "list-no-vinculados"] });
        },
        onError: (error) => {
            console.error('Error al subir archivo:', error);
        },
    });
    return mutation;
}

export const useEstudiosNoVinculados = ({ location_id }: { location_id: string }) => {

    const { data, isLoading, error, refetch } = useQuery<EstudiosNoVinculados>({
        queryKey: cargarEstudiosKeys.listNoVinculados(location_id),
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

export const useSearchExams = ({ location_id }: { location_id: string }) => {
    const { data, isLoading, error, refetch } = useQuery<SearchExams>({
        queryKey: cargarEstudiosKeys.searchExams(location_id),
        queryFn: () => getSearchExams({ location_id }),
        enabled: !!location_id,
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });
    return {
        ordenesSinImagenData: data,
        isLoading,
        error,
        refetchOrdenesSinImagen: refetch,
    }
}

export const useVincularEstudio = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ upload_guid, examination_guid }: { upload_guid: string, examination_guid: string }) => {
            const response = await postVinculacion({ upload_guid, examination_guid });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...cargarEstudiosKeys.all, "list-no-vinculados"] });
            toast.success("Estudio vinculado exitosamente")
        },
        onError: (error) => {
            console.error('Error al vincular estudio:', error);
        },
    });
    return mutation;
}
