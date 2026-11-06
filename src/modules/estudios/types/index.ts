export interface Study {
    examination_id: string;
    order_id: string;
    accession_number: string;
    patient_name: string;
    patient_id: string;
    study_type: string;
    modality: string;
    study_date: string;
    study_time: string;
    status: "Reportado" | "Pendiente";
    has_report: boolean;
    has_images: boolean;
    referring_physician: string;
    requesting_physician: string;
    author_physician: string;
    urgency: "Urgente" | "Normal";
    report_date: string | null;
    study_uid: string | null;
}



export interface StudiesFilters {
    page?: number;
    per_page?: number;
    status?: "reported" | "pending" | "";
    date_from?: string;
    date_to?: string;
    search?: string;
}
