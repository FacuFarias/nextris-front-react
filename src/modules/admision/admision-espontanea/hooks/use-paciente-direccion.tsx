import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postPacientesDireccion } from "../services/pacientes-direccion.service";

export const usePacienteDireccion = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { uuid: string; searchTerm?: string }) =>
            postPacientesDireccion(data),
        onSuccess: () => {
            // Invalidar la query de pacientes para refrescar la lista
            queryClient.invalidateQueries({ queryKey: ["pacientesDireccion"] });
        }
        ,
        onError: (error: any) => {
            console.error("Error al obtener pacientes por dirección:", error);
        },
    });
}
