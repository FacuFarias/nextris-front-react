import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InformeDetalle, type Informes, type StudyNote, type ExaminationNotesResponse } from "../types/informes.types";
import type { ApiPaginatedResponse } from "@/types/global.type";
import { getInformeDetalle, getInformes, putRedactarInforme, blockExam, unblockExam, updateExaminationFlags, updateExaminationTagIds, getAllTags, createGeneralNote, getExaminationNotes, deleteExaminationNote, getPatientHistory, assignExam, assignExamBatch, addTagsToExamsBatch, addFlagsToExamsBatch, confirmStudy, cancelStudy, markStudyAlreadyRead, getCancellationReasons, type ConfirmStudyPayload, type UpdateReportPayload } from "../services/informes.service";
import { informesKeys } from "../constants/query-keys";
import { toast } from "sonner";
import { notifyInformeChange, useCrossWindowSync } from "../redactar-informe/hooks/use-cross-windows";

export const useInformes = ({ page = 1, per_page = 8, search = "", show_reported = false, show_ready = false, assigned_to_me = false, show_no_image = false, show_without_order = false, show_only_with_notes = false, bodypart_id = "", modality_id = "", study_group_id = "", flag_filter = "", date_range = "all", date_field = "admision", sort_column = "", sort_direction = "desc" }) => {
    useCrossWindowSync();

    const { data, isLoading, isFetching, error, refetch } = useQuery<ApiPaginatedResponse<Informes>>({
        queryKey: informesKeys.list(page, per_page, search, show_reported, show_ready, assigned_to_me, show_no_image, show_without_order, bodypart_id, modality_id, study_group_id, flag_filter, date_range, date_field, sort_column, sort_direction, show_only_with_notes),
        queryFn: () => getInformes({ page, per_page, search, show_reported, show_ready, assigned_to_me, show_no_image, show_without_order, show_only_with_notes, bodypart_id, modality_id, study_group_id, flag_filter, date_range, date_field, sort_column, sort_direction }),
        refetchInterval: 120000,
        refetchIntervalInBackground: false,
    });

    return {
        informesData: data,
        isLoading,
        isFetching,
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

export const useConfirmStudy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId, data }: { examId: string; data: ConfirmStudyPayload }) =>
            confirmStudy(examId, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: informesKeys.listDetalle(undefined) });
            toast.success(response.message || 'Estudio confirmado correctamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al confirmar el estudio');
        },
    });
};

export const useCancellationReasons = (enabled = true) => useQuery({
    queryKey: ['cancellation-reasons'],
    queryFn: getCancellationReasons,
    enabled,
    staleTime: 10 * 60 * 1000,
});

export const useCancelStudy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ examId, reasonCode, detail }: { examId: string; reasonCode: string; detail?: string }) =>
            cancelStudy(examId, reasonCode, detail),
        onSuccess: (response, variables) => {
            queryClient.setQueriesData({ queryKey: informesKeys.lists() }, (old: any) => {
                if (!old?.data?.data) return old;
                return { ...old, data: { ...old.data, data: old.data.data.map((item: Informes) =>
                    item.guid === variables.examId
                        ? { ...item, workflow_state: 'cancelled', status: 'Cancelled', workflow_state_at: new Date().toISOString(), workflow_state_source: 'nextris_ui', cancellation_reason_code: variables.reasonCode, cancellation_reason: response?.data?.reason || item.cancellation_reason }
                        : item
                ) } };
            });
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            toast.success(response.message || 'Estudio cancelado correctamente');
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo cancelar el estudio'),
    });
};

export const useMarkStudyAlreadyRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (examId: string) => markStudyAlreadyRead(examId),
        onSuccess: (response, examId) => {
            queryClient.setQueriesData({ queryKey: informesKeys.lists() }, (old: any) => {
                if (!old?.data?.data) return old;
                return { ...old, data: { ...old.data, data: old.data.data.map((item: Informes) =>
                    item.guid === examId
                        ? { ...item, workflow_state: 'already_read', is_reported: true, report_date: new Date().toISOString(), workflow_state_at: new Date().toISOString() }
                        : item
                ) } };
            });
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            toast.success(response.message || 'Estudio marcado como ya leído');
        },
        onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo marcar el estudio como leído'),
    });
};

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
            await queryClient.cancelQueries({ queryKey: informesKeys.listDetalle(examId) });

            // Guardar snapshot del estado anterior (para rollback)
            const previousData = queryClient.getQueriesData({ queryKey: informesKeys.lists() });
            const previousDetail = queryClient.getQueryData(informesKeys.listDetalle(examId));

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

            queryClient.setQueryData(informesKeys.listDetalle(examId), (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        flags,
                    },
                };
            });

            return { previousData, previousDetail, examId };
        },

        // Si el servidor falla, revertir al estado anterior
        onError: (error: any, _vars, context: any) => {
            if (context?.previousData) {
                context.previousData.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            if (context?.previousDetail && context?.examId) {
                queryClient.setQueryData(informesKeys.listDetalle(context.examId), context.previousDetail);
            }
            toast.error(error.response?.data?.message || 'Error al actualizar bandera');
        },

        onSuccess: (_response, variables) => {
            queryClient.invalidateQueries({ queryKey: informesKeys.listDetalle(variables.examId) });
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
            await queryClient.cancelQueries({ queryKey: informesKeys.listDetalle(examId) });
            const previousData = queryClient.getQueriesData({ queryKey: informesKeys.lists() });
            const previousDetail = queryClient.getQueryData(informesKeys.listDetalle(examId));

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

            queryClient.setQueryData(informesKeys.listDetalle(examId), (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        tag_ids: tagIds,
                    },
                };
            });

            return { previousData, previousDetail, examId };
        },

        onError: (error: any, _vars, context: any) => {
            if (context?.previousData) {
                context.previousData.forEach(([queryKey, data]: [any, any]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            if (context?.previousDetail && context?.examId) {
                queryClient.setQueryData(informesKeys.listDetalle(context.examId), context.previousDetail);
            }
            toast.error(error.response?.data?.message || 'Error al actualizar tags');
        },

        onSuccess: (_response, variables) => {
            queryClient.invalidateQueries({ queryKey: informesKeys.listDetalle(variables.examId) });
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

export const useExaminationNotes = (examId: string, enabled: boolean) => {
    const { data, isLoading, isFetching, error } = useQuery<ExaminationNotesResponse>({
        queryKey: informesKeys.notes(examId),
        queryFn: () => getExaminationNotes(examId),
        enabled,
    });

    return {
        notes: data?.data?.notes ?? [],
        isLoading: isLoading || isFetching,
        error,
    };
};

export const useUpdateGeneralNotes = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId, notes }: { examId: string; notes: string }) =>
            createGeneralNote(examId, notes),

        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al guardar la nota');
        },

        onSuccess: (response, { examId }) => {
            const note = response?.data as StudyNote | undefined;
            if (note) {
                queryClient.setQueriesData(
                    { queryKey: informesKeys.lists() },
                    (old: any) => {
                        if (!old?.data?.data) return old;
                        return {
                            ...old,
                            data: {
                                ...old.data,
                                data: old.data.data.map((item: Informes) => {
                                    if (item.guid !== examId) return item;
                                    return {
                                        ...item,
                                        general_notes: note.message,
                                        notes_count: (item.notes_count ?? 0) + 1,
                                        recent_notes: [note, ...(item.recent_notes ?? [])].slice(0, 3),
                                    };
                                }),
                            },
                        };
                    }
                );

                queryClient.setQueryData<ExaminationNotesResponse>(informesKeys.notes(examId), (old) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            notes: [note, ...(old.data.notes ?? [])],
                        },
                    };
                });
            }
            toast.success('Nota guardada');
        },
    });
}

export const useDeleteExaminationNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId, noteId }: { examId: string; noteId: string }) =>
            deleteExaminationNote(examId, noteId),

        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al eliminar la nota');
        },

        onSuccess: (_response, { examId, noteId }) => {
            queryClient.setQueriesData(
                { queryKey: informesKeys.lists() },
                (old: any) => {
                    if (!old?.data?.data) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            data: old.data.data.map((item: Informes) => {
                                if (item.guid !== examId) return item;
                                const recentNotes = (item.recent_notes ?? []).filter((note) => note.id !== noteId);
                                return {
                                    ...item,
                                    general_notes: recentNotes[0]?.message ?? null,
                                    notes_count: Math.max(0, (item.notes_count ?? 0) - 1),
                                    recent_notes: recentNotes,
                                };
                            }),
                        },
                    };
                }
            );
            queryClient.setQueryData<ExaminationNotesResponse>(informesKeys.notes(examId), (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        notes: old.data.notes.filter((note) => note.id !== noteId),
                    },
                };
            });
            toast.success('Nota eliminada');
        },
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
} */

export const usePatientHistory = (patientId: string | undefined) => {
    const { data, isLoading } = useQuery({
        queryKey: ['patient-history', patientId],
        queryFn: () => getPatientHistory(patientId!),
        enabled: !!patientId,
        staleTime: 5 * 60 * 1000, // 5 minutos — historial no cambia durante la sesión
    });
    return { historyData: data, isLoading };
}

export const useAssignExam = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId, userId }: { examId: string; userId: string }) => assignExam(examId, userId),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            toast.success(response.message || 'Estudio asignado correctamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al asignar el estudio');
        }
    });
}

export const useAssignExamBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examIds, userId }: { examIds: string[]; userId: string }) => assignExamBatch(examIds, userId),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            toast.success(response.message);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.message || 'Error al asignar los estudios');
        }
    });
};

export const useAddTagsBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examIds, tagIds }: { examIds: string[]; tagIds: string[] }) => addTagsToExamsBatch(examIds, tagIds),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            toast.success(response.message);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.message || 'Error al agregar tags');
        }
    });
};

export const useAddFlagsBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examIds, flags }: { examIds: string[]; flags: string[] }) => addFlagsToExamsBatch(examIds, flags),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: informesKeys.lists() });
            toast.success(response.message);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.message || 'Error al agregar banderas');
        }
    });
};
