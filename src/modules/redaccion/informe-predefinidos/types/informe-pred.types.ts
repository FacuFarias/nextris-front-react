export type ReportType = 'simple' | 'inteligente';

export interface Template {
    guid: string;
    title: string;
    study_type_id: string;
    study_type_description?: string;
    study_type_code?: string;
    study_reason: string;
    content: string;
    conclusion: string;
    /** @deprecated response aliases */
    findings?: string;
    technique?: string;
    impression?: string;
    bodypart_description: string;
    bodypart_id: string;
    modality_description: string;
    modality_id: string;
    report_type: ReportType;
    location_ids?: string[];
    structured_variables?: string;
    criteria?: string;
    is_default?: boolean;
    owner_id: string;
    can_edit: boolean;
    can_delete: boolean;
    is_user_default?: boolean;
    is_system_default?: boolean;
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
    study_reason?: string;
    content?: string;
    conclusion?: string;
    report_type?: ReportType;
    location_ids?: string[];
    structured_variables?: string;
    criteria?: string;
    is_default?: boolean;
}

export interface UpdateTemplateRequest {
    title?: string;
    study_type_id?: string;
    study_reason?: string;
    content?: string;
    conclusion?: string;
    report_type?: ReportType;
    location_ids?: string[];
    structured_variables?: string;
    criteria?: string;
    is_default?: boolean;
}
