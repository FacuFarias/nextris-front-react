import { api } from "@/lib/api"

export const getInformes = async ({ page = 1, per_page = 8, search = "", show_reported = false, show_ready = false }) => {
    try {
        const response = await api.get(`/examinations/for-reporting?page=${page}&per_page=${per_page}&search=${search}&show_reported=${show_reported}&show_ready=${show_ready}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getInformeDetalle = async (guid: string | undefined) => {
    try {
        const response = await api.get(`/examinations/${guid}/report`);
        return response.data;
    } catch (error) {
        throw error;
    }
}


export interface UpdateReportPayload {
    findings?: string;
    impressions?: string;
    techniques?: string;
    conclusions?: string;
    mark_as_reported?: boolean;
}

export const putRedactarInforme = async (exam_id: string, data: UpdateReportPayload) => {
    try {
        const response = await api.put(`/examinations/${exam_id}/report`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
}