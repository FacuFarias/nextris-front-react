import { api } from "@/lib/api";
import type {
    ClinicaParqueLogDetailResponse,
    ClinicaParqueLogsResponse,
} from "./types";

export const clinicaParqueIntegrationService = {
    listLogs: async (params: {
        page: number;
        perPage: number;
        search?: string;
        apiEndpoint?: string;
        success?: "" | "true" | "false";
    }): Promise<ClinicaParqueLogsResponse> => {
        const response = await api.get<ClinicaParqueLogsResponse>("/clinicaparque/logs", {
            params: {
                page: params.page,
                per_page: params.perPage,
                search: params.search || undefined,
                api_endpoint: params.apiEndpoint || undefined,
                success: params.success || undefined,
            },
        });
        return response.data;
    },

    getLogDetail: async (guid: string): Promise<ClinicaParqueLogDetailResponse> => {
        const response = await api.get<ClinicaParqueLogDetailResponse>("/clinicaparque/logs/" + guid);
        return response.data;
    },
};
