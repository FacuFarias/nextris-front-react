
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postSignReport } from "../services/redactar-informe.service";
import { toast } from "sonner";
import { informesKeys } from "../../constants/query-keys";
import { notifyInformeChange } from "./use-cross-windows";

interface SignReportParams {
    informeGuid: string;
    modality_id?: string | null;
    body_part_id?: string | null;
    study_group_id?: string | null;
}

export const useSignReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ informeGuid, ...payload }: SignReportParams) =>
            postSignReport(informeGuid, payload),
        onSuccess: () => {
            toast.success('Informe firmado exitosamente');
            queryClient.invalidateQueries({
                queryKey: informesKeys.lists()
            });

            notifyInformeChange('INFORME_SIGNED');

        },
        onError: (error: any) => {
            toast.error('Error al firmar el informe');
            console.error('Error al firmar:', error);
        }
    });
};
