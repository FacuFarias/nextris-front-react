import type { PaginatedResponse } from "@/types/global.type";
import { getAllPacientes } from "../services/buscar-paciente.service";
import type { Patient } from "../types/BuscarPaciente";
import { useQuery } from "@tanstack/react-query";

export const useBuscarPaciente = ({ page = 1, per_page = 8, search = "" }) => {
    const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Patient>>({
        queryKey: ['patients', page, per_page, search],
        queryFn: () => getAllPacientes({ page, per_page, search }),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    return {
        patientsData: data,
        isLoading,
        error,
        refetchPatients: refetch,
    }
}
