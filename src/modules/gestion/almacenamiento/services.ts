import { api } from "@/lib/api";
import type { ApiEnvelope, CacheCopy, CacheStudies, StorageHistory, StorageOverview } from "./types";

export const storageService = {
    cache: async (page: number, search: string): Promise<CacheStudies> => {
        const response = await api.get<ApiEnvelope<CacheStudies>>("/storage/cache/studies", { params: { page, search, per_page: 25 } });
        return response.data.data;
    },
    removeCache: async (studyPk: number, storage: CacheCopy["storage"]) => {
        const response = await api.delete<ApiEnvelope<{ status: "queued"; already_queued: boolean }>>(`/storage/cache/studies/${studyPk}`, {
            data: { storage, confirm: true },
        });
        return response.data.data;
    },
    overview: async (days: number): Promise<StorageOverview> => {
        const response = await api.get<ApiEnvelope<StorageOverview>>("/storage/overview", { params: { days } });
        return response.data.data;
    },
    history: async (days: number): Promise<StorageHistory> => {
        const response = await api.get<ApiEnvelope<StorageHistory>>("/storage/history", { params: { days } });
        return response.data.data;
    },
};
