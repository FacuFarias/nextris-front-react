import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postVerifyCredentials } from "../services/redactar-informe.service";
import { toast } from "sonner";
import { informesKeys } from "../../constants/query-keys";

export const useVerifyCredentials = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ password, examId }: { password: string; examId?: string }) => postVerifyCredentials({ password, examId }),
        onSuccess: (response) => {
            toast.success(response.message || 'Credenciales verificadas');
            queryClient.invalidateQueries({ queryKey: informesKeys.all });
        }
    });
}
