import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPatient } from "../services/buscar-paciente.service";
import { toast } from "sonner";
import type { CreatePatientFormValues } from "../schemas/create-patient.schema";

export const useCreatePatient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePatientFormValues) => createPatient(data),
        onSuccess: () => {
            toast.success("Paciente creado exitosamente", {
                position: "top-right",
                className: "[&_svg]:text-brand-purple",
            });
            // Invalidar la query de pacientes para refrescar la lista
            queryClient.invalidateQueries({ queryKey: ["patients"] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Error al crear el paciente", {
                duration: 4000,
                position: "top-right",
            });
        },
    });
};
