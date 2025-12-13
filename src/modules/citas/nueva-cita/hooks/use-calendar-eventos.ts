import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postObtenerEventosPrevios } from '../services/calendar-eventos.service';
import { toast } from 'sonner';

export const useCalendarEventos = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) =>
            postObtenerEventosPrevios({ data }),
        onSuccess: () => {
            /* toast.success("Eventos obtenidos exitosamente", {
                position: "top-right",
            }); */
            queryClient.invalidateQueries({ queryKey: ["calendarEventos"] });
        }
        ,
        onError: (error: any) => {
            console.error("Error al obtener pacientes por dirección:", error);
            toast.error("Error al crear paciente");
        },
    });
}
