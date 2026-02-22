import { api } from "@/lib/api";
import type { ExaminacionesResponse, UpdateDemograficosPayload } from "../types/demograficos.type";

export const demograficosService = {
    getAll: async (): Promise<ExaminacionesResponse> => {
        const response = await api.get('/examinations/demograficos');
        return response.data;
    },
    update: async (guid: string, payload: UpdateDemograficosPayload): Promise<{ success: boolean; message: string }> => {
        const response = await api.patch(`/examinations/${guid}/demograficos`, payload);
        return response.data;
    },
};
