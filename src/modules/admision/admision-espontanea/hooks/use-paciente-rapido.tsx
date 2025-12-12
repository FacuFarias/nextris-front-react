import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postPacientesFast } from '../services/pacientes-direccion.service';
import { toast } from 'sonner';

export const usePacienteRapido = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) =>
            postPacientesFast({ data }),
        onSuccess: () => {
            toast.success("Paciente creado exitosamente", {
                position: "top-right",
            });
            queryClient.invalidateQueries({ queryKey: ["pacientesDireccion"] });
        }
        ,
        onError: (error: any) => {
            console.error("Error al obtener pacientes por dirección:", error);
            toast.error("Error al crear paciente");
        },
    });
}
