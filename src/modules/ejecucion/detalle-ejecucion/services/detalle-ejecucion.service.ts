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
