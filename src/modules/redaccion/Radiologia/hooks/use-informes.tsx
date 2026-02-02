import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InformeDetalle, type Informes } from "../types/informes.types";
import type { ApiPaginatedResponse } from "@/types/global.type";
import { getInformeDetalle, getInformes, putRedactarInforme, blockExam, unblockExam, type UpdateReportPayload } from "../services/informes.service";
import { informesKeys } from "../constants/query-keys";
import { toast } from "sonner";
import { notifyInformeChange, useCrossWindowSync } from "../redactar-informe/hooks/use-cross-windows";

export const useInformes = ({ page = 1, per_page = 8, search = "", show_reported = false, show_ready = false, bodypart_id = "", modality_id = "", study_group_id = "" }) => {
    useCrossWindowSync();

    const { data, isLoading, error, refetch } = useQuery<ApiPaginatedResponse<Informes>>({
        queryKey: informesKeys.list(page, per_page, search, show_reported, show_ready, bodypart_id, modality_id, study_group_id),
        queryFn: () => getInformes({ page, per_page, search, show_reported, show_ready, bodypart_id, modality_id, study_group_id }),
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });

    return {
        informesData: data,
        isLoading,
        error,
        refetchInformes: refetch,
    }
}


export const useInformeDetalle = (guid: string | undefined) => {
    const { data, isLoading, error, refetch } = useQuery<InformeDetalle>({
        queryKey: informesKeys.listDetalle(guid),
        queryFn: () => getInformeDetalle(guid),
    });

    return {
        informeDetalle: data,
        isLoading,
        error,
        refetchInformes: refetch,
    }
}

export const useUpdateReport = (examId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateReportPayload) => putRedactarInforme(examId, data),
        onSuccess: (response) => {
            // Invalidar las queries relacionadas para refrescar los datos
            queryClient.invalidateQueries({ queryKey: informesKeys.listDetalle(examId) });
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });

            toast.success(response.message || 'Reporte guardado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al guardar el reporte');
        }
    });
}

export const useBlockExam = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (examId: string) => blockExam(examId),
        onSuccess: (response) => {
            // Invalidar las queries para refrescar la lista
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            toast.success(response.message || 'Informe bloqueado para edición');
            notifyInformeChange('INFORME_UNBLOCKED');

        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || 'Error al bloquear el informe';
            toast.error(errorMessage);
            throw error; // Re-lanzar el error para manejarlo en el componente
        }
    });
}

export const useUnblockExam = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (examId: string) => unblockExam(examId),

        onSuccess: () => {
            // Invalidar las queries para refrescar la lista
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            notifyInformeChange('INFORME_UNBLOCKED');

        },
        onError: (error: any) => {
            console.error('Error al desbloquear el informe:', error);
            // No mostrar toast aquí porque puede ser al salir de la página
        }
    });
}


/* export const useUnblockOnUnmount = (informeGuid: string | undefined) => {
    useEffect(() => {
        const unblockExam = () => {
            if (!informeGuid) return;

            const url = `${import.meta.env.VITE_API_URL}/examinations/${informeGuid}/unblock`;
            const data = new Blob(
                [JSON.stringify({ inform_guid: informeGuid })],
                { type: 'application/json' }
            );

            // Intentar con sendBeacon primero
            const beaconSent = navigator.sendBeacon(url, data);

            // Si sendBeacon falla, intentar con fetch keepalive
            if (!beaconSent) {
                fetch(url, {
                    method: 'POST',
                    keepalive: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inform_guid: informeGuid })
                }).catch(err => console.error('Error desbloqueando:', err));
            }
        };

        // Agregar listeners para múltiples eventos
        const events = ['beforeunload', 'pagehide', 'unload'];
        events.forEach(event => window.addEventListener(event, unblockExam));

        // Cleanup
        return () => {
            events.forEach(event => window.removeEventListener(event, unblockExam));
            unblockExam(); // También desbloquear en cleanup
        };
    }, [informeGuid]);
}; */