import { api } from "@/lib/api";
import type {
    TemplateListResponse,
    TemplateResponse,
    CreateTemplateRequest,
    UpdateTemplateRequest
} from "../types/informe-pred.types";

/**
 * Obtiene la lista de todas las plantillas con filtros opcionales
 * @param studyTypeId - UUID del tipo de estudio (opcional)
 * @param modalityId - UUID de la modalidad (opcional)
 * @param bodypartId - UUID de la parte del cuerpo (opcional)
 * @returns Lista de plantillas
 */
export const getTemplates = async (
    studyTypeId?: string,
    modalityId?: string,
    bodypartId?: string,
    reportType?: string
): Promise<TemplateListResponse> => {
    try {
        const params = new URLSearchParams();

        if (studyTypeId) params.append('study_type_id', studyTypeId);
        if (modalityId) params.append('modality_id', modalityId);
        if (bodypartId) params.append('bodypart_id', bodypartId);
        if (reportType) params.append('report_type', reportType);

        const url = params.toString()
            ? `/templates?${params.toString()}`
            : '/templates';

        const response = await api.get<TemplateListResponse>(url);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Obtiene los datos completos de una plantilla específica
 * @param templateId - UUID de la plantilla
 * @returns Datos de la plantilla
 */
export const getTemplateById = async (templateId: string): Promise<TemplateResponse> => {
    try {
        const response = await api.get<TemplateResponse>(`/templates/${templateId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Crea una nueva plantilla de informe
 * @param templateData - Datos de la plantilla a crear
 * @returns Respuesta con el GUID de la plantilla creada
 */
export const createTemplate = async (templateData: CreateTemplateRequest): Promise<TemplateResponse> => {
    try {
        const response = await api.post<TemplateResponse>('/templates', templateData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Actualiza una plantilla existente
 * @param templateId - UUID de la plantilla a actualizar
 * @param updates - Datos a actualizar
 * @returns Respuesta de actualización
 */
export const updateTemplate = async (
    templateId: string,
    updates: UpdateTemplateRequest
): Promise<TemplateResponse> => {
    try {
        const response = await api.put<TemplateResponse>(`/templates/${templateId}`, updates);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Elimina una plantilla
 * @param templateId - UUID de la plantilla a eliminar
 * @returns Respuesta de eliminación
 */
export const deleteTemplate = async (templateId: string): Promise<{ success: boolean; data: { message: string } }> => {
    try {
        const response = await api.delete(`/templates/${templateId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Selecciona una plantilla para aplicar a un informe
 * @param templateId - UUID de la plantilla a seleccionar
 * @returns Datos completos de la plantilla seleccionada
 */
export const selectTemplate = async (templateId: string): Promise<TemplateResponse> => {
    try {
        const response = await api.post<TemplateResponse>(`/templates/select/${templateId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};