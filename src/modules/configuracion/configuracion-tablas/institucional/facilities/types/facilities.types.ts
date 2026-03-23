export interface Facility {
    guid: string;
    description: string;
    id_patientdomain?: string;
    patientdomain_id?: string;
    patientdomain_name?: string;
    created_at: string;
    updated_at: string;
    name: string;
    code: string;
    email: string;
    contact_person: string;
    smtp_config: {
        smtp_server: string;
        smtp_port: number;
        smtp_user: string;
        smtp_password: string;
        smtp_from: string;
        smtp_from_name: string;
        smtp_use_tls: boolean;
    };
    backend_config: {
        backend_db_user: string;
        backend_db_password: string;
        backend_db_host: string;
        backend_db_port: number;
        backend_db_name: string;
        backend_base_folder: string;
        backend_ipserver: string;
    };
    whatsapp_config: {
        whatsapp_api_url: string;
        whatsapp_token: string;
        whatsapp_phone_number_id: string;
        whatsapp_business_account_id: string;
        whatsapp_webhook_verify_token: string;
        whatsapp_is_active: boolean;
    };
}


export interface FacilityResponse {
    success: boolean;
    data: Facility[];
}

export interface FacilityFormData {
    description: string;
    id_patientdomain?: string;

    // SMTP Config
    smtp_server?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    smtp_from?: string;
    smtp_from_name?: string;
    smtp_use_tls?: boolean;

    // Backend Config
    backend_db_user?: string;
    backend_db_password?: string;
    backend_db_host?: string;
    backend_db_port?: number;
    backend_db_name?: string;
    backend_base_folder?: string;
    backend_ipserver?: string;

    // WhatsApp Config
    whatsapp_api_url?: string;
    whatsapp_token?: string;
    whatsapp_phone_number_id?: string;
    whatsapp_business_account_id?: string;
    whatsapp_webhook_verify_token?: string;
    whatsapp_is_active?: boolean;
}
