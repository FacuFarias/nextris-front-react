import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { patientsKeys } from "../../constants/query-keys";
import type { HistoryPatientResponse } from "../../types/BuscarPaciente";
import { getHistoryPatient, postViewImagenDicom, toggleExamVisibility } from "../../services/buscar-paciente.service";

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

export const useToggleExamVisibility = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (examGuid: string) => toggleExamVisibility(examGuid),
        onSuccess: (data) => {
            const hidden = data?.data?.hidden_in_portal;
            toast.success(
                hidden ? "Estudio ocultado del portal" : "Estudio visible en el portal",
                { duration: 3000, position: "top-right" }
            );
            queryClient.invalidateQueries({ queryKey: patientsKeys.histories() });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Error al cambiar visibilidad", {
                duration: 4000,
                position: "top-right",
            });
        }
    });

    return {
        toggleVisibility: mutation.mutateAsync,
    }
}