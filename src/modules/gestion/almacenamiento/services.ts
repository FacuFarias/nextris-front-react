import { api } from "@/lib/api";
import type { ApiEnvelope, StorageHistory, StorageOverview } from "./types";

export const storageService = {
    overview: async (days: number): Promise<StorageOverview> => {
        const response = await api.get<ApiEnvelope<StorageOverview>>("/storage/overview", { params: { days } });
        return response.data.data;
    },
    history: async (days: number): Promise<StorageHistory> => {
        const response = await api.get<ApiEnvelope<StorageHistory>>("/storage/history", { params: { days } });
        return response.data.data;
    },
};
