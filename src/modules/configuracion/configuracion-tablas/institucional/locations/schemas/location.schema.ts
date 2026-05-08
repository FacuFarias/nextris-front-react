import { z } from "zod";

export const locationFormSchema = z.object({
    name: z.string().min(1, "La descripción es requerida"),
    code: z.string().optional(),
    facility_id: z.string().min(1, "La facility es requerida"),
    status: z.enum(["Active", "Inactive"]).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    timezone: z.string().optional(),
    // Transmisión DICOM
    gateway_aet: z.string().max(64).optional(),
    gateway_ip: z.string().max(45).optional(),
    transmission_type: z.enum(["Manual", "Automatic"]).optional(),
    retention_days: z.number().int().min(1).optional(),
    require_execution_before_reporting: z.boolean().optional(),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;
