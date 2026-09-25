
import type { EstudiosNoVinculados, LinkedStudiesResponse, SearchExams, UnlinkStudyPayload } from '../types/cargar-estudios.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLinkedStudies, getSearchExams, getUnlinkedStudies, postDesvinculacion, postVinculacion, uploadFiles } from '../services/cargar-estudios.service';
import { cargarEstudiosKeys } from '../constants/query-keys';
import { toast } from 'sonner';

export const useCargarEstudios = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ file }: { file: File }) => {
            const response = await uploadFiles(file);
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

export const useEstudiosNoVinculados = ({
    include_linked = false,
    include_pacs = true,
}: {
    include_linked?: boolean,
    include_pacs?: boolean,
} = {}) => {

    const { data, isLoading, isFetching, error, refetch } = useQuery<EstudiosNoVinculados>({
        queryKey: cargarEstudiosKeys.listNoVinculados(include_linked, include_pacs),
        queryFn: () => getUnlinkedStudies({ include_linked, include_pacs }),
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });
    return {
        estudiosNoVinculadosData: data,
        isLoading,
        isFetching,
        error,
        refetchEstudiosNoVinculados: refetch,
    }
}

export const useSearchExams = () => {
    const { data, isLoading, isFetching, error, refetch } = useQuery<SearchExams>({
        queryKey: cargarEstudiosKeys.searchExams(),
        queryFn: () => getSearchExams({}),
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });
    return {
        ordenesSinImagenData: data,
        isLoading,
        isFetching,
        error,
        refetchOrdenesSinImagen: refetch,
    }
}

export const useVincularEstudio = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ upload_guid, examination_guid, pacs_study_pk, study_instance_uid }: { upload_guid?: string, examination_guid: string, pacs_study_pk?: number, study_instance_uid?: string }) => {
            const response = await postVinculacion({ upload_guid, examination_guid, pacs_study_pk, study_instance_uid });
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

export const useEstudiosVinculados = () => {
    const { data, isLoading, isFetching, error, refetch } = useQuery<LinkedStudiesResponse>({
        queryKey: cargarEstudiosKeys.listLinkedStudies(),
        queryFn: () => getLinkedStudies(),
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });

    return {
        estudiosVinculadosData: data,
        isLoading,
        isFetching,
        error,
        refetchEstudiosVinculados: refetch,
    }
}

export const useDesvincularEstudio = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (payload: UnlinkStudyPayload) => {
            const response = await postDesvinculacion(payload);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...cargarEstudiosKeys.all, "list-linked-studies"] });
            queryClient.invalidateQueries({ queryKey: [...cargarEstudiosKeys.all, "list-no-vinculados"] });
            queryClient.invalidateQueries({ queryKey: [...cargarEstudiosKeys.all, "search-examinations"] });
            toast.success("Estudio desvinculado exitosamente")
        },
        onError: (error) => {
            console.error('Error al desvincular estudio:', error);
        },
    });
    return mutation;
}
