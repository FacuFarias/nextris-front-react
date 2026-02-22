import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { demograficosService } from "../services/demograficos.service";
import { DEMOGRAFICOS_QUERY_KEYS } from "../constants/query-keys";
import type { UpdateDemograficosPayload } from "../types/demograficos.type";

export const useDemograficos = () => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: DEMOGRAFICOS_QUERY_KEYS.list(),
        queryFn: demograficosService.getAll,
    });

    return { examinaciones: data?.data ?? [], isLoading, refetch };
};

export const useUpdateDemograficos = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ guid, payload }: { guid: string; payload: UpdateDemograficosPayload }) =>
            demograficosService.update(guid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEMOGRAFICOS_QUERY_KEYS.list() });
        },
    });
};
