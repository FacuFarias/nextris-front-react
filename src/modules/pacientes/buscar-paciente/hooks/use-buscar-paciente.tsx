import type { ApiPaginatedResponse } from "@/types/global.type";
import { deletePatient, getAllPacientes } from "../services/buscar-paciente.service";
import type { Patient } from "../types/BuscarPaciente";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useBuscarPaciente = ({ page = 1, per_page = 8, search = "" }) => {
    const { data, isLoading, error, refetch } = useQuery<ApiPaginatedResponse<Patient>>({
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

export const useEliminarPaciente = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (patientId: string) => deletePatient(patientId),
        onSuccess: () => {
            toast.success("Paciente eliminado correctamente", {
                position: "top-right",
                className: "[&_svg]:text-brand-purple",
            });
            // Invalidar la query de pacientes para refrescar la lista
            queryClient.invalidateQueries({ queryKey: ["patients"] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Error al eliminar el paciente", {
                duration: 4000,
                position: "top-right",
            });
        },
    });
}
