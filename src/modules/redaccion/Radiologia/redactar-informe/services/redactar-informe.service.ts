import { api } from "@/lib/api";


export const postVerifyCredentials = async ({ password }: { password: string }) => {
    try {
        const response = await api.post(`/verify-credentials`, { password });
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