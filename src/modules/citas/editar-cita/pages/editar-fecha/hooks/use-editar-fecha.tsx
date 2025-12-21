import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postReprogramarCita } from "../services/editar-fecha.service";
import { useNavigate } from "react-router-dom";

export const useEditarFecha = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (data: any) =>
            postReprogramarCita({ data }),
        onSuccess: () => {
            toast.success("Cita reprogramada exitosamente", {
                position: "top-right",
            });
            queryClient.invalidateQueries({ queryKey: ["citas"] });
            navigate("/cita/editar-cita");
        }
        ,
        onError: (error: any) => {
            console.error("Error al obtener pacientes por dirección:", error);
            toast.error("Error al crear paciente");
        },
    });
}
