import { useMutation, useQueryClient } from "@tanstack/react-query";
import { creatOrderForPatient, postPacientesDireccion } from "../services/pacientes-direccion.service";
import { toast } from "sonner";
import { admisionKeys } from "../../constants/query-keys";

export const usePacienteDireccion = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { uuid: string; searchTerm?: string }) =>
            postPacientesDireccion(data),
        onSuccess: () => {
            // Invalidar la query de pacientes para refrescar la lista
            queryClient.invalidateQueries({ queryKey: admisionKeys.pacientesDireccion() });
        }
        ,
        onError: (error: any) => {
            console.error("Error al obtener pacientes por dirección:", error);
        },
    });
}

export const useCrearOrdenParaPaciente = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) =>
            creatOrderForPatient({ data }),
        onSuccess: () => {
            toast.success("Orden creada exitosamente", {
                position: "top-right",
            });
            queryClient.invalidateQueries({ queryKey: admisionKeys.pacientesDireccion() });
            onSuccessCallback?.();
        }
        ,
        onError: (error: any) => {
            console.error("Error al crear orden para paciente:", error);
        },
    });
}
