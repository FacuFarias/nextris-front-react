import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { distribucionService } from '../services/distribucion.service';
import { DistribucionKeys } from '../constants/query-keys';

export const useDistribucion = (allReported: boolean = false, page: number = 1, perPage: number = 50, dateRange: string = "all", dateField: string = "admision") => {
    const queryClient = useQueryClient();

    // Query para obtener exámenes
    const { data: examenes, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: [DistribucionKeys.all, allReported, page, perPage, dateRange, dateField],
        queryFn: () => distribucionService.getExamenes(allReported, page, perPage, dateRange, dateField),
        gcTime: 5 * 60 * 1000, // 5 minutos
        staleTime: 1 * 60 * 1000, // 1 minuto (datos frescos)
    });

    // Mutation para enviar informe via clinicaparque API
    const sendReportMutation = useMutation({
        mutationFn: ({ examId }: { examId: string }) =>
            distribucionService.sendReport(examId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [DistribucionKeys.all] });
        },
    });

    // Mutation para actualizar email (deprecated pero conservada por si se necesita en el futuro)
    const updateEmailMutation = useMutation({
        mutationFn: ({ examId, payload }: { examId: string; payload: { email: string } }) =>
            distribucionService.updateEmail(examId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [DistribucionKeys.all] });
        },
    });

    return {
        examenes,
        isLoading,
        isFetching,
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
