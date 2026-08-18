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
        if (filters.date_from) params.append("date_from", filters.date_from);
        if (filters.date_to) params.append("date_to", filters.date_to);
        if (filters.search) params.append("search", filters.search);

        const response = await api.get<ApiPaginatedResponse<Study>>(
            `/patient-portal/my-studies?${params.toString()}`
        );

        return response.data;
    },

    /**
     * Abre el PDF del informe en una nueva pestaña
     */
    openReport: async (examId: string): Promise<void> => {
        const response = await api.get(`/patient-portal/examinations/${examId}/report`, {
            responseType: "blob",
        });
        const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        window.open(url, "_blank");
    },

    /**
     * Comparte el informe de un estudio por email a un médico externo
     */
    shareStudy: async (examId: string, email: string, doctorName?: string): Promise<void> => {
        await api.post(`/patient-portal/examinations/${examId}/share`, {
            email,
            doctor_name: doctorName || "",
        });
    },
};
