

interface EstudioNoVinculado {
    guid: string;
    filename: string;
    patient_name: string;
    patient_id: string;
    study_date: string;
    study_time: string;
    study_description: string;
    modality: string;
    study_instance_uid: string;
    accession_number: string;
    upload_date: string;
    uploaded_by: string;
    pacs_status: string;
    file_size_mb: number;
    instance_count?: number;
    source?: 'manual' | 'pacs';
    pacs_study_pk?: number | null;
}
export interface EstudiosNoVinculados {
    success: boolean;
    data: {
        data: EstudioNoVinculado[];
        total: number;
    };
}


interface SearchExamsData {
    guid: string;
    accession: string;
    patient_name: string;
    patient_id: string;
    date: string;
    study_type: string;
    is_image: number;
}


export interface SearchExams {
    success: boolean;
    data: {
        data: SearchExamsData[];
        total: number;
    };
}


export interface LinkedStudyData {
    link_id: number | null;
    examination_guid: string | null;
    order_study_uuid: string | null;
    pacs_study_pk: number | null;
    study_instance_uid: string | null;
    manual_upload_guid: string | null;
    source: 'manual' | 'reconcile' | string;
    linked_at: string | null;
    linked_by: string | null;
    order_accession: string;
    order_date: string | null;
    location_id: string | null;
    patient_name: string;
    patient_id: string;
    study_type: string;
    pacs_accession: string | null;
    pacs_study_description: string | null;
    pacs_patient_name: string;
}

export interface LinkedStudiesResponse {
    success: boolean;
    data: {
        data: LinkedStudyData[];
        total: number;
    };
}

export interface UnlinkStudyPayload {
    link_id?: number;
    examination_guid?: string;
    pacs_study_pk?: number;
    study_instance_uid?: string;
    reason?: string;
}