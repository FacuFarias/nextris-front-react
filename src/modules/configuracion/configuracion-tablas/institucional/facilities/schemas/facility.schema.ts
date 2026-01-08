import { z } from "zod";

export const facilityFormSchema = z.object({
    description: z.string().min(1, "La descripción es requerida"),

    // SMTP Config
    smtp_server: z.string().optional(),
    smtp_port: z.number().optional(),
    smtp_user: z.string().optional(),
    smtp_password: z.string().optional(),
    smtp_from: z.string().optional(),
    smtp_from_name: z.string().optional(),
    smtp_use_tls: z.boolean().optional(),

    // Backend Config
    backend_db_user: z.string().optional(),
    backend_db_password: z.string().optional(),
    backend_db_host: z.string().optional(),
    backend_db_port: z.number().optional(),
    backend_db_name: z.string().optional(),
    backend_base_folder: z.string().optional(),
    backend_ipserver: z.string().optional(),

    // WhatsApp Config
    whatsapp_api_url: z.string().optional(),
    whatsapp_token: z.string().optional(),
    whatsapp_phone_number_id: z.string().optional(),
    whatsapp_business_account_id: z.string().optional(),
    whatsapp_webhook_verify_token: z.string().optional(),
    whatsapp_is_active: z.boolean().optional(),
});

export type FacilityFormValues = z.infer<typeof facilityFormSchema>;
