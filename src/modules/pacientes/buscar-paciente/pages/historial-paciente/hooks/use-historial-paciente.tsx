import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HistoryPatientResponse } from "../../../types/BuscarPaciente";
import { getHistoryPatient, postViewImagenDicom } from "../../../services/buscar-paciente.service";
import { toast } from "sonner";
import { patientsKeys } from "../../../constants/query-keys";

export const useHistorialPaciente = ({ patientId }: { patientId: string }) => {
    const { data, isLoading, error, refetch } = useQuery<HistoryPatientResponse>({
        queryKey: patientsKeys.history(patientId),
        queryFn: () => getHistoryPatient({ patientId }),
    });

    return {
        historyData: data,
        isLoading,
        error,
        refetchHistory: refetch,
    }
}

export const useViewImagenDicom = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (data: { imageId: string; userId: string }) => postViewImagenDicom(data),
        onSuccess: (data) => {
            window.open(data.viewer_url, '_blank');
            queryClient.invalidateQueries({ queryKey: patientsKeys.histories() });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error viewing DICOM image", {
                duration: 4000,
                position: "top-right",
            });
            console.error("Error viewing DICOM image:", error);
        }
    });

    return {
        viewImagenDicom: mutation.mutateAsync,

    }
}