import { api } from "@/lib/api";
import type { StudiesFilters, Study } from "../types";
import type { ApiPaginatedResponse } from "@/types";

export const estudiosService = {
    /**
     * Obtiene los estudios médicos del paciente autenticado
     */
    getMyStudies: async (filters: StudiesFilters = {}): Promise<ApiPaginatedResponse<Study>> => {
        const params = new URLSearchParams();

        if (filters.page) params.append("page", filters.page.toString());
        if (filters.per_page) params.append("per_page", filters.per_page.toString());
        if (filters.status) params.append("status", filters.status);

        const response = await api.get<ApiPaginatedResponse<Study>>(
            `/patient-portal/my-studies?${params.toString()}`
        );

        return response.data;
    },
};
