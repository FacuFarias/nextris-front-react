import { api } from '@/lib/api';

interface ViewerUrlResponse {
    success: boolean;
    data?: {
        viewer_url: string;
        study_uid: string;
        expires_in: number;
        access_token: string;
        html_page: string;
        direct_url: string;
    };
    message?: string;
}

export const getDicomViewerUrl = async (userId: string, examinationId: string) => {
    const response = await api.post<ViewerUrlResponse>('/general/viewer-url', {
        user_id: userId,
        examination_id: examinationId,
    });

    if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error desconocido');
    }

    return response.data.data;
};
