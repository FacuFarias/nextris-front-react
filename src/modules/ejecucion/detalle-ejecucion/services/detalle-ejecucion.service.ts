import { api } from "@/lib/api";
import type { DetalleEjecucionRequest } from "../types/detalle-ejecucion.type";

export const getDetalleEjecucion = async (guid: string) => {
    try {
        // Ajusta el endpoint según tu API
        const response = await api.get(`/executions/examination/${guid}/details`);
        return response.data;
    } catch (error) {
        throw error;
    }
};


export const postDetalleEjecucion = async (data: DetalleEjecucionRequest, guid: string) => {
    try {
        const response = await api.post(`/executions/examination/${guid}/execute`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateExecutionFlags = async (examId: string, flags: string[]) => {
    try {
        const response = await api.patch(`/examinations/${examId}/flags`, { flags });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateExecutionTagIds = async (examId: string, tag_ids: string[]) => {
    try {
        const response = await api.patch(`/examinations/${examId}/tag_ids`, { tag_ids });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getExecutionAllTags = async () => {
    try {
        const response = await api.get('/tags/all');
        return response.data;
    } catch (error) {
        throw error;
    }
};
