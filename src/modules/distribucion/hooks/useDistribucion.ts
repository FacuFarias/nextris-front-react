import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { distribucionService } from '../services/distribucion.service';
import { DistribucionKeys } from '../constants/query-keys';
import type { SendReportPayload, UpdateEmailPayload } from '../types/distribucion.types';

export const useDistribucion = (allReported: boolean = false, page: number = 1, perPage: number = 50) => {
    const queryClient = useQueryClient();

    // Query para obtener exámenes
    const { data: examenes, isLoading, error, refetch } = useQuery({
        queryKey: [DistribucionKeys.all, allReported, page, perPage],
        queryFn: () => distribucionService.getExamenes(allReported, page, perPage),
        gcTime: 5 * 60 * 1000, // 5 minutos
        staleTime: 1 * 60 * 1000, // 1 minuto (datos frescos)
    });

    // Mutation para enviar informe
    const sendReportMutation = useMutation({
        mutationFn: ({ examId, payload }: { examId: string; payload: SendReportPayload }) =>
            distribucionService.sendReport(examId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [DistribucionKeys.all] });
        },
    });

    // Mutation para actualizar email
    const updateEmailMutation = useMutation({
        mutationFn: ({ examId, payload }: { examId: string; payload: UpdateEmailPayload }) =>
            distribucionService.updateEmail(examId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [DistribucionKeys.all] });
        },
    });

    return {
        examenes,
        isLoading,
        error,
        refetch,
        sendReport: sendReportMutation.mutate,
        sendReportAsync: sendReportMutation.mutateAsync,
        isSendingReport: sendReportMutation.isPending,
        updateEmail: updateEmailMutation.mutate,
        updateEmailAsync: updateEmailMutation.mutateAsync,
        isUpdatingEmail: updateEmailMutation.isPending,
    };
};
