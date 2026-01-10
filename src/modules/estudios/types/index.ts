export interface Study {
    examination_id: string;
    order_id: string;
    accession_number: string;
    study_type: string;
    modality: string;
    study_date: string;
    study_time: string;
    status: "Reportado" | "Pendiente";
    has_report: boolean;
    has_images: boolean;
    referring_physician: string;
    location: string;
    urgency: "Urgente" | "Normal";
    report_date: string | null;
}



export interface StudiesFilters {
    page?: number;
    per_page?: number;
    status?: "reported" | "pending" | "";
}
