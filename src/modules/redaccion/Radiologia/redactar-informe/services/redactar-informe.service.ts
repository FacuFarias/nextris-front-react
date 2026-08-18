import { api } from "@/lib/api";


export const postVerifyCredentials = async ({ password, examId }: { password: string; examId?: string }) => {
    try {
        const response = await api.post(`/verify-credentials`, { password, exam_id: examId });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const postSignReport = async (
    informeGuid: string,
    payload: {
        modality_id?: string | null;
        body_part_id?: string | null;
        study_group_id?: string | null;
        facility_id?: string | null;
    }
) => {
    const response = await api.post(`/reports/${informeGuid}/sign`, payload);
    return response.data;
};

export const postNextExam = async (payload: {
    current_exam_id: string;
    show_ready?: boolean;
    show_reported?: boolean;
    assigned_to_me?: boolean;
    show_no_image?: boolean;
    show_without_order?: boolean;
    sort_column?: string;
    sort_direction?: 'asc' | 'desc';
    modality_id?: string | null;
    body_part_id?: string | null;
    study_group_id?: string | null;
    facility_id?: string | null;
}) => {
    const response = await api.post('/reports/next-exam', payload);
    return response.data;
};


export const postQuitarFirma = async ({ examId }: { examId: string }) => {
    const response = await api.post(`/quitar_firma/${examId}`);
    return response.data;
};
