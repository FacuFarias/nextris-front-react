import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminsionCitaAll, getAdmisionDetailData, postConfirmAdmision } from "../services/admision-cita.service";
import type { AdmisionResponse } from "../types/admision.type";
import { admisionKeys } from "../../constants/query-keys";
import { toast } from "sonner";

export const useAdmisionCita = () => {
    const { data, isLoading, error, refetch } = useQuery<AdmisionResponse>({
        queryKey: admisionKeys.lists(),
        queryFn: () => getAdminsionCitaAll(),
    });

    return {
        admisionData: data,
        isLoading,
        error,
        refetchAdmision: refetch,
    }
}

export const useAdmisionDetail = (guid: string | undefined) => {
    const { data, isLoading, error, refetch } = useQuery<AdmisionResponse>({
        queryKey: admisionKeys.details(guid),
        queryFn: () => getAdmisionDetailData(guid),
    });

    return {
        admisionData: data,
        isLoading,
        error,
        refetchAdmision: refetch,
    }
}
export const useAdmisionConfirm = (guid: string | undefined) => {
    const queryClient = useQueryClient();

    const { mutateAsync, error, isPending, isSuccess } = useMutation({
        mutationFn: (data: any) => postConfirmAdmision(guid, data),
        onSuccess: () => {
            toast.success('Admisión confirmada con éxito', {
                duration: 4000,
                position: 'top-right',
            });
            queryClient.invalidateQueries({ queryKey: admisionKeys.lists() });
        },
        onError: (error) => {
            console.log('Error:', error);
            toast.error(error.message || 'Error enviando el detalle de ejecución', {
                duration: 4000,
                position: 'top-right',
            });
        },
    });

    return {
        error,
        postConfirmAdmision: mutateAsync,
        isLoading: isPending,
        isSuccess,
    };
}
