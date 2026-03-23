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
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;
