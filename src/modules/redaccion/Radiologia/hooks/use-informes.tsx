import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InformeDetalle, type Informes } from "../types/informes.types";
import type { ApiPaginatedResponse } from "@/types/global.type";
import { getInformeDetalle, getInformes, putRedactarInforme, blockExam, unblockExam, updateExaminationFlags, updateExaminationTagIds, getAllTags, type UpdateReportPayload } from "../services/informes.service";
import { informesKeys } from "../constants/query-keys";
import { toast } from "sonner";
import { notifyInformeChange, useCrossWindowSync } from "../redactar-informe/hooks/use-cross-windows";

export const useInformes = ({ page = 1, per_page = 8, search = "", show_reported = false, show_ready = false, show_no_image = false, bodypart_id = "", modality_id = "", study_group_id = "", flag_filter = "", date_range = "all", date_field = "admision" }) => {
    useCrossWindowSync();

    const { data, isLoading, isFetching, error, refetch } = useQuery<ApiPaginatedResponse<Informes>>({
        queryKey: informesKeys.list(page, per_page, search, show_reported, show_ready, show_no_image, bodypart_id, modality_id, study_group_id, flag_filter, date_range, date_field),
        queryFn: () => getInformes({ page, per_page, search, show_reported, show_ready, show_no_image, bodypart_id, modality_id, study_group_id, flag_filter, date_range, date_field }),
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });

    return {
        informesData: data,
        isLoading: isLoading || isFetching,
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
        onSuccess: () => {
            // Invalidar las queries para refrescar la lista
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            notifyInformeChange('INFORME_UNBLOCKED');

        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || 'Error al bloquear el informe';
            toast.error(errorMessage);
            throw error; // Re-lanzar el error para manejarlo en el componente
        }
    });
}

export const useUpdateFlags = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId, flags }: { examId: string; flags: string[] }) =>
            updateExaminationFlags(examId, flags),

        // Actualización optimista: cambia el cache local al instante, sin refetch
        onMutate: async ({ examId, flags }) => {
            // Cancelar cualquier refetch en curso para no sobreescribir el optimismo
            await queryClient.cancelQueries({ queryKey: informesKeys.lists() });

            // Guardar snapshot del estado anterior (para rollback)
            const previousData = queryClient.getQueriesData({ queryKey: informesKeys.lists() });

            // Actualizar todas las páginas del cache que contengan este examen
            queryClient.setQueriesData(
                { queryKey: informesKeys.lists() },
                (old: any) => {
                    if (!old?.data?.data) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            data: old.data.data.map((item: Informes) =>
                                item.guid === examId ? { ...item, flags } : item
                            ),
                        },
                    };
                }
            );

            return { previousData };
        },

        // Si el servidor falla, revertir al estado anterior
        onError: (error: any, _vars, context: any) => {
            if (context?.previousData) {
                context.previousData.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(error.response?.data?.message || 'Error al actualizar bandera');
        },
    });
}

export const useUpdateTagIds = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId, tagIds }: { examId: string; tagIds: string[] }) =>
            updateExaminationTagIds(examId, tagIds),

        onMutate: async ({ examId, tagIds }) => {
            await queryClient.cancelQueries({ queryKey: informesKeys.lists() });
            const previousData = queryClient.getQueriesData({ queryKey: informesKeys.lists() });

            queryClient.setQueriesData(
                { queryKey: informesKeys.lists() },
                (old: any) => {
                    if (!old?.data?.data) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            data: old.data.data.map((item: Informes) =>
                                item.guid === examId ? { ...item, tag_ids: tagIds } : item
                            ),
                        },
                    };
                }
            );

            return { previousData };
        },

        onError: (error: any, _vars, context: any) => {
            if (context?.previousData) {
                context.previousData.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(error.response?.data?.message || 'Error al actualizar tags');
        },
    });
}

export const useAllTags = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['tags', 'all'],
        queryFn: getAllTags,
        staleTime: 5 * 60 * 1000,
    });

    return {
        allTags: data?.data ?? [],
        isLoading,
    };
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