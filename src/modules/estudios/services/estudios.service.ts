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

    /** Obtiene el PDF del informe */
    getReport: async (examId: string) => {
        return api.get(`/patient-portal/examinations/${examId}/report`, {
            responseType: "blob",
        });
    },

    /** Abre el PDF del informe en una nueva pestaña */
    openReport: async (examId: string): Promise<void> => {
        const target = window.open("about:blank", "_blank");
        if (!target) throw new Error("El navegador bloqueó la ventana del informe");
        const response = await estudiosService.getReport(examId);
        const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        target.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },

    /** Descarga el PDF del informe */
    downloadReport: async (examId: string): Promise<void> => {
        const response = await estudiosService.getReport(examId);
        const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `informe_${examId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    },

    /** Descarga las imágenes DICOM del estudio en un archivo ZIP */
    downloadImages: async (examId: string): Promise<void> => {
        const response = await api.get(`/patient-portal/examinations/${examId}/images/download`, {
            responseType: "blob",
        });
        const url = URL.createObjectURL(new Blob([response.data], { type: "application/zip" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `estudio_${examId}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    },

    /** Genera un Case Link público para el estudio */
    createCaseLink: async (examId: string) => {
        const response = await api.post(`/patient-portal/examinations/${examId}/case-link`);
        return response.data as {
            success: boolean;
            data: { case_url: string; expires_at: string; expires_hours: number };
            message?: string;
        };
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
