import { useQuery } from "@tanstack/react-query";
import type { HistoryPatientResponse } from "../../../types/BuscarPaciente";
import { getHistoryPatient } from "../../../services/buscar-paciente.service";

export const useHistorialPaciente = ({ patientId }: { patientId: string }) => {
    const { data, isLoading, error, refetch } = useQuery<HistoryPatientResponse>({
        queryKey: [patientId, 'history'],
        queryFn: () => getHistoryPatient({ patientId }),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    return {
        historyData: data,
        isLoading,
        error,
        refetchHistory: refetch,
    }
}
