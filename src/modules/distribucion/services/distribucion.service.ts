import { api } from '@/lib/api';
import type {
    SendReportPayload,
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
        facilityId: string = ""
    ): Promise<ApiPaginatedResponse<Examen>> => {
        const response = await api.get('/examinations/distribution', {
            params: {
                all_reported: allReported,
                page,
                per_page: perPage,
                facility_id: facilityId,
            }
        });
        return response.data;
    },

    // POST /examinations/{exam_id}/send-report
    sendReport: async (examId: string, payload: SendReportPayload): Promise<ApiResponse> => {
        const response = await api.post(`/examinations/${examId}/send-report`, payload);
        return response.data;
    },

    // PATCH /examinations/{exam_id}/update-email
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
            window.open(`https://viewer.nextris.cloud${response.data.data.viewer_url}`, '_blank');
        } else {
            throw new Error('No se pudo obtener la URL del visor DICOM');
        }
    },
};
