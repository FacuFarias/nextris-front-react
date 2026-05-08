
import type { EstudiosNoVinculados, LinkedStudiesResponse, SearchExams, UnlinkStudyPayload } from '../types/cargar-estudios.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLinkedStudies, getSearchExams, getUnlinkedStudies, postDesvinculacion, postVinculacion, uploadFiles } from '../services/cargar-estudios.service';
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

export const useEstudiosNoVinculados = ({
    location_id,
    include_linked = false,
    include_pacs = true,
}: {
    location_id: string,
    include_linked?: boolean,
    include_pacs?: boolean,
}) => {

    const { data, isLoading, error, refetch } = useQuery<EstudiosNoVinculados>({
        queryKey: cargarEstudiosKeys.listNoVinculados(location_id, include_linked, include_pacs),
        queryFn: () => getUnlinkedStudies({ location_id, include_linked, include_pacs }),
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

export const useEstudiosVinculados = ({ location_id }: { location_id: string }) => {
    const { data, isLoading, error, refetch } = useQuery<LinkedStudiesResponse>({
        queryKey: cargarEstudiosKeys.listLinkedStudies(location_id),
        queryFn: () => getLinkedStudies({ location_id }),
        enabled: !!location_id,
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });

    return {
        estudiosVinculadosData: data,
        isLoading,
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
