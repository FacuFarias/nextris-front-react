import { useQuery } from "@tanstack/react-query";
import { type InformeDetalle, type Informes } from "../types/informes.types";
import type { ApiPaginatedResponse } from "@/types/global.type";
import { getInformeDetalle, getInformes } from "../services/informes.service";
import { informesKeys } from "../constants/query-keys";

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
