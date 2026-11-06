import { api } from "@/lib/api";
import type {
    SharedAccessLinksResponse,
    SharedAccessStatus,
    SharedAccessType,
} from "./types";

export const sharedAccessService = {
    list: async (params: {
        type: SharedAccessType;
        status: SharedAccessStatus;
        includeRevoked: boolean;
        page: number;
        perPage: number;
        search?: string;
    }): Promise<SharedAccessLinksResponse> => {
        const response = await api.get<SharedAccessLinksResponse>("/general/shared-access-links", {
            params: {
                type: params.type,
                status: params.status,
                include_revoked: params.includeRevoked,
                page: params.page,
                per_page: params.perPage,
                search: params.search || undefined,
            },
        });
        return response.data;
    },

    extend: async (guid: string, expiresAt: string) => {
        const response = await api.patch(`/general/shared-access-links/${guid}`, {
            expires_at: expiresAt,
        });
        return response.data;
    },

    revoke: async (guid: string) => {
        const response = await api.post(`/general/shared-access-links/${guid}/revoke`);
        return response.data;
    },
};
