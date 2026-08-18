import type { ApiPaginatedResponse } from "@/types/global.type";
import { createPatientUser, deactivatePatientUser, activatePatientUser, getAllPacientes } from "../services/buscar-paciente.service";
import type { Patient } from "../types/BuscarPaciente";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { patientsKeys } from "../constants/query-keys";

export const useBuscarPaciente = ({ page = 1, per_page = 8, search = "", hide_without_studies = false, column_filters = "{}" }) => {
    const { data, isLoading, isFetching, error, refetch } = useQuery<ApiPaginatedResponse<Patient>>({
        queryKey: patientsKeys.list(page, per_page, search, hide_without_studies, column_filters),
        queryFn: () => getAllPacientes({ page, per_page, search, hide_without_studies, column_filters }),
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

export const useDesactivarUsuario = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (patientId: string) => deactivatePatientUser(patientId),
        onSuccess: () => {
            toast.success("Usuario desactivado correctamente", {
                position: "top-right",
                className: "[&_svg]:text-brand-purple",
            });
            queryClient.invalidateQueries({ queryKey: patientsKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Error al desactivar el usuario", {
                duration: 4000,
                position: "top-right",
            });
        },
    });
}

export const useActivarUsuario = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (patientId: string) => activatePatientUser(patientId),
        onSuccess: () => {
            toast.success("Usuario activado correctamente", {
                position: "top-right",
                className: "[&_svg]:text-brand-purple",
            });
            queryClient.invalidateQueries({ queryKey: patientsKeys.lists() });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Error al activar el usuario", {
                duration: 4000,
                position: "top-right",
            });
        },
    });
}
