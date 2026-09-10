export interface ClinicaParqueLog {
    guid: string;
    received_at: string | null;
    api_endpoint: string;
    http_method: string;
    patient_id: string | null;
    patient_name: string | null;
    accession_number: string | null;
    order_id: string | null;
    response_status: number | null;
    success: boolean;
    error_message: string | null;
    source_ip: string | null;
    duration_ms: number | null;
    direction: "Recibido" | "Enviado";
}

export interface ClinicaParqueLogDetail extends ClinicaParqueLog {
    request_body: string | null;
    response_body: string | null;
}

export interface ClinicaParqueLogsResponse {
    success: boolean;
    data: {
        items: ClinicaParqueLog[];
        page: number;
        per_page: number;
        total: number;
        pages: number;
        available_endpoints: string[];
    };
}

export interface ClinicaParqueLogDetailResponse {
    success: boolean;
    data: ClinicaParqueLogDetail;
}
