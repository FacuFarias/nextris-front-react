import { z } from "zod";

export const createPatientSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres",
    }),
    surname: z.string().min(2, {
        message: "El apellido debe tener al menos 2 caracteres",
    }),
    documentnumber: z.string(),
    birthdate: z.string().min(1, {
        message: "La fecha de nacimiento es requerida",
    }),
    gender: z.enum(["M", "F", "Otro"] as const, {
        message: "Seleccione un género",
    }),
    email: z.string().email({
        message: "Email inválido",
    }).optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    healthinsurance: z.string().optional(),
    patientdomain_id: z.string().min(1, {
        message: "El dominio del paciente es requerido",
    }).optional(),
    patientid: z.string().optional(),
});

export type CreatePatientFormValues = z.infer<typeof createPatientSchema>;