

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
}
export interface EstudiosNoVinculados {
    success: boolean;
    data: {
        data: EstudioNoVinculado[];
        total: number;
    };
}