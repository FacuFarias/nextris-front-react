import { z } from "zod";

export const createPatientFastSchema = z.object({
    nombre: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres",
    }),
    apellido: z.string().min(2, {
        message: "El apellido debe tener al menos 2 caracteres",
    }),
    dni: z.string().min(7, {
        message: "El número de documento debe tener al menos 7 caracteres",
    }),
    fecha_nac: z.string().min(1, {
        message: "La fecha de nacimiento es requerida",
    }),
    sexo: z.enum(["M", "F", "Otro"] as const, {
        message: "Seleccione un género",
    }),
});

export type CreatePatientFormFast = z.infer<typeof createPatientFastSchema>;