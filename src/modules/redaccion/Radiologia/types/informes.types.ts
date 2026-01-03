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
    study_instance_uid: string;
    location: string;
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
        history: string;
        updated_on: string;
        patient_name: string;
    }

}


