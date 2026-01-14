import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InformeDetalle, type Informes } from "../types/informes.types";
import type { ApiPaginatedResponse } from "@/types/global.type";
import { getInformeDetalle, getInformes, putRedactarInforme, type UpdateReportPayload } from "../services/informes.service";
import { informesKeys } from "../constants/query-keys";
import { toast } from "sonner";

export const useInformes = ({ page = 1, per_page = 8, search = "", show_reported = false, show_ready = false }) => {
    const { data, isLoading, error, refetch } = useQuery<ApiPaginatedResponse<Informes>>({
        queryKey: informesKeys.list(page, per_page, search, show_reported, show_ready),
        queryFn: () => getInformes({ page, per_page, search, show_reported, show_ready }),
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