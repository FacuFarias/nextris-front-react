import { api } from '@/lib/api';
import type {
    UpdateEmailPayload,
    ApiResponse,
    Examen,
    DICOMViewerResponse
} from '../types/distribucion.types';
import type { ApiPaginatedResponse } from '@/types';

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

    // POST /clinicaparque/reports/send - Enviar informe via API externa
    sendReport: async (examId: string): Promise<ApiResponse> => {
        const response = await api.post(`/clinicaparque/reports/send`, { exam_id: examId });
        return response.data;
    },

    // PATCH /examinations/{exam_id}/update-email (deprecated - no longer used)
    updateEmail: async (examId: string, payload: UpdateEmailPayload): Promise<ApiResponse> => {
        const response = await api.patch(`/examinations/${examId}/update-email`, payload);
        return response.data;
    },

    /**
     * Visualiza el informe PDF en una nueva pestaña
     */
    viewReport: (examinationId: string): void => {
        const token = localStorage.getItem('authData');
        const parsedToken = token ? JSON.parse(token) : null;
        const accessToken = parsedToken?.access_token;

        if (!accessToken) {
            throw new Error('No se encontró el token de autenticación');
        }

        const url = `${api.defaults.baseURL}/examinations/${examinationId}/report/view`;
        window.open(url, '_blank');
    },

    /**
     * Descarga el informe PDF
     */
    downloadReport: async (examinationId: string): Promise<void> => {
        const response = await api.get(
            `/examinations/${examinationId}/report/view?download=true`,
            {
                responseType: 'blob',
            }
        );

        // Crear un enlace temporal para descargar el archivo
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `informe_${examinationId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

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
