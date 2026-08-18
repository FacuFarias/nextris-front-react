import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postUnificacionPaciente } from "../services/unificacion-paciente.service";
import { patientsKeys } from "@/modules/pacientes/buscar-paciente/constants/query-keys";
import { toast } from "sonner";

export const useUnificacionPaciente = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { master_guid: string; duplicate_guid: string }) =>
            postUnificacionPaciente(data),
        onSuccess: () => {
            // Invalidar la query de pacientes para refrescar la lista
            queryClient.invalidateQueries({ queryKey: patientsKeys.lists() });
            toast.success("Pacientes unificados correctamente");

        }
        ,
        onError: (error: any) => {
            console.error("Error al obtener pacientes por dirección:", error);
        },
    });
}