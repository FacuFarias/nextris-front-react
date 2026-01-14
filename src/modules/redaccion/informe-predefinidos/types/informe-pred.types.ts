export interface Template {
    guid: string;
    title: string;
    study_type_id: string;
    study_type_description?: string;
    findings: string;
    technique: string;
    impression: string;
    conclusion: string;
    bodypart_description: string;
    bodypart_id: string;
    modality_description: string;
    modality_id: string;
}

export interface TemplateListResponse {
    success: boolean;
    data: Template[];
}

export interface TemplateResponse {
    success: boolean;
    data: Template;
}

export interface CreateTemplateRequest {
    title: string;
    study_type_id: string;
    findings?: string;
    technique?: string;
    impression?: string;
    conclusion?: string;
    is_default?: boolean;
}

export interface UpdateTemplateRequest {
    title?: string;
    study_type_id?: string;
    findings?: string;
    technique?: string;
    impression?: string;
    conclusion?: string;
}


