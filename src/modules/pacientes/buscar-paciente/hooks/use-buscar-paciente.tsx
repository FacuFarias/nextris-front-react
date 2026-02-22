import type { ApiPaginatedResponse } from "@/types/global.type";
import { createPatientUser, deletePatient, getAllPacientes } from "../services/buscar-paciente.service";
import type { Patient } from "../types/BuscarPaciente";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { patientsKeys } from "../constants/query-keys";

export const useBuscarPaciente = ({ page = 1, per_page = 8, search = "", hide_without_studies = false }) => {
    const { data, isLoading, isFetching, error, refetch } = useQuery<ApiPaginatedResponse<Patient>>({
        queryKey: patientsKeys.list(page, per_page, search, hide_without_studies),
        queryFn: () => getAllPacientes({ page, per_page, search, hide_without_studies }),
    });

    return {
        patientsData: data,
        isLoading: isLoading || isFetching,
        error,
        refetchPatients: refetch,
    }
}

export const useCrearUsuarioPaciente = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (patientGuid: string) => createPatientUser(patientGuid),
        onSuccess: (data) => {
            toast.success(data?.message || "Usuario creado correctamente", {
                position: "top-right",
                className: "[&_svg]:text-brand-purple",
            });
            queryClient.invalidateQueries({ queryKey: patientsKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Error al crear el usuario", {
                duration: 4000,
                position: "top-right",
            });
        },
    });
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
            queryClient.invalidateQueries({ queryKey: patientsKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Error al eliminar el paciente", {
                duration: 4000,
                position: "top-right",
            });
        },
    });
}
