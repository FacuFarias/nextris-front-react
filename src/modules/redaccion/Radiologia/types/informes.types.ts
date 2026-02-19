export type Informes = {
    guid: string;
    patient_name: string;
    patient_dni: string;
    study_type: string;
    admission_number: string;
    accession_number: string;
    created_on: string;
    status: string;
    is_reported: boolean;
    is_executed: boolean;
    equipment: string;
    is_image: boolean;
    blocked_by: string;
    blocked_by_name: string;
    study_instance_uid: string;
    location: string;
    pdf_path: string;
    flags: string[];
    tag_ids: string[];
    report_date: string | null;
    general_notes: string | null;
}



export type InformeDetalle = {
    success: boolean;
    data: {
        guid: string;
        exam_id: string;
        patient_id: string;
        admission_number: string;
        findings: string;
        impressions: string;
        techniques: string;
        conclusions: string;
        was_saved: boolean;
        created_on: string;
        is_reported: boolean;
        sex: string;
        pdf_path: string;
        history: string;
        updated_on: string;
        patient_name: string;
        flags?: string[];
        tag_ids?: string[];
    }

}


