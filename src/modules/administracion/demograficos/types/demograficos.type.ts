export interface Examinacion {
    exam_guid: string;
    createdon: string;
    createdon_raw: string;
    localacc: string;
    admisionnumber: string;
    status: string;
    study_type: string;
    patient_guid: string;
    patientid: string;
    name: string;
    surname: string;
    nationalcode: string;
    sexcode: string;
    birthdate: string;
    studytype_id: string;
    modality_id: string;
    studygroup_id: string;
    bodypart_id: string;
}

export interface ExaminacionesResponse {
    success: boolean;
    data: Examinacion[];
}

export interface UpdateDemograficosPayload {
    name?: string;
    surname?: string;
    nationalcode?: string;
    sexcode?: string;
    birthdate?: string;
    localacc?: string;
    admisionnumber?: string;
    status?: string;
    createdon?: string;
    patientid?: string;
}
