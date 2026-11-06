import { api } from '@/lib/api';
import type {
    UpdateEmailPayload,
    ApiResponse,
    Examen,
    DICOMViewerResponse
} from '../types/distribucion.types';
import type { ApiPaginatedResponse } from '@/types';
import { getReportView } from '@/services/reportView';

export const distribucionService = {
    // GET /examinations/distribution
    getExamenes: async (
        allReported: boolean = false,
        page: number = 1,
        perPage: number = 50,
        dateRange: string = "all",
        dateField: string = "admision"
    ): Promise<ApiPaginatedResponse<Examen>> => {
        const response = await api.get('/examinations/distribution', {
            params: {
                all_reported: allReported,
                page,
                per_page: perPage,
                date_range: dateRange,
                date_field: dateField,
            }
        });
        return response.data;
    },

    // Send the locally finalized report using institutional SMTP settings.
    sendReport: async (examId: string, email: string): Promise<ApiResponse> => {
        const response = await api.post(`/examinations/${encodeURIComponent(examId)}/send-report`, { email }, {
            timeout: 45000,
        });
        return response.data;
    },

    // PATCH /examinations/{exam_id}/update-email (deprecated - no longer used)
    updateEmail: async (examId: string, payload: UpdateEmailPayload): Promise<ApiResponse> => {
        const response = await api.patch(`/examinations/${examId}/update-email`, payload);
        return response.data;
    },

    /**
     * Consulta el informe en NextRIS para el visor de solo lectura.
     */
    viewReport: getReportView,

    /**
     * Obtiene información del visor DICOM y abre el estudio
     */
    getDicomViewer: async (examinationId: string): Promise<void> => {
        const response = await api.get<DICOMViewerResponse>(
            `/examinations/${examinationId}/dicom-viewer`
        );

        if (response.data.success && response.data.data.viewer_url) {
            window.open(response.data.data.viewer_url, '_blank');
        } else {
            throw new Error('No se pudo obtener la URL del visor DICOM');
        }
    },
};
