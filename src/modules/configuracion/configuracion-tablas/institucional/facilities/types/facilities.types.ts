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
    status: 'Active' | 'Inactive' | string;
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
    plan?: {
        code?: string;
        name?: string;
        max_receive_monthly?: number | null;
        max_distribute_monthly?: number | null;
        max_users?: number | null;
    };
    usage_monthly?: {
        received_count: number;
        read_count: number;
        distributed_count: number;
        users_count_snapshot: number;
    };
}


export interface FacilityResponse {
    success: boolean;
    data: Facility[];
}

export interface FacilityFormData {
    description: string;
    id_patientdomain?: string;
    plan_code?: string;

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

export interface FacilityPlan {
    guid: string;
    code: string;
    name: string;
    description?: string;
    max_receive_monthly: number | null;
    max_distribute_monthly: number | null;
    max_users: number | null;
    is_active: boolean;
}

export interface FacilityUsageMonthly {
    usage_year: number;
    usage_month: number;
    received_count: number;
    read_count: number;
    distributed_count: number;
    users_count_snapshot: number;
    updated_at?: string | null;
}

export interface FacilityPlanChangeLog {
    guid: string;
    previous_plan_id?: string | null;
    new_plan_id: string;
    previous_plan_code?: string | null;
    new_plan_code?: string | null;
    action: 'activated' | 'upgraded' | 'downgraded' | 'changed';
    changed_by_user_id?: string | null;
    reason?: string | null;
    request_ip?: string | null;
    changed_at?: string | null;
}
