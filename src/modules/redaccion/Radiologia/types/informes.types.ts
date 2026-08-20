export type StudyNote = {
    id: string;
    author_id: string;
    author_username: string;
    author_display_name: string;
    message: string;
    created_on: string;
};

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
    num_instances: number;
    location: string;
    pdf_path: string;
    flags: string[];
    tag_ids: string[];
    report_date: string | null;
    general_notes: string | null;
    recent_notes: StudyNote[];
    notes_count: number;
    assigned_to: string | null;
    assignto_name: string;
    modality_id: string | null;
    modality_description: string;
    w_order: number;
    referring_physician_id: string | null;
    requesting_physician_id: string | null;
    requesting_physician_name: string;
    clinical_question: string;
    study_type_id: string | null;
    other_details: string;
}

export type ExaminationNotesResponse = {
    success: boolean;
    data: {
        history: string;
        clinical_question: string;
        others_details: string;
        number_of_views: string;
        stat: string;
        laterality: string;
        notes: StudyNote[];
    };
};



export type InformeDetalle = {
    success: boolean;
    data: {
        guid: string;
        exam_id: string;
        patient_id: string;
        patientid?: string;
        national_code?: string;
        admission_number: string;
        accession_number?: string;
        study_description?: string;
        modality?: string;
        exam_date?: string;
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
