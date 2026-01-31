import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postVerifyCredentials } from "../services/redactar-informe.service";
import { toast } from "sonner";
import { informesKeys } from "../../constants/query-keys";

export const useVerifyCredentials = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ password }: { password: string }) => postVerifyCredentials({ password }),
        onSuccess: (response) => {
            toast.success(response.message || 'Reporte firmado exitosamente');
            queryClient.invalidateQueries({ queryKey: informesKeys.all });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al guardar el reporte');
        }
    });
}
