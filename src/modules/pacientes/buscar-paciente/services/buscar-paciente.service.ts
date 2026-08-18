import { api } from "@/lib/api";
import type { CreatePatientFormValues } from "../schemas/create-patient.schema";

export const getAllPacientes = async ({ page = 1, per_page = 8, search = "", hide_without_studies = false, column_filters = "{}" }) => {
    try {
        const response = await api.get(`/patients?page=${page}&per_page=${per_page}&search=${search}&hide_without_studies=${hide_without_studies}&column_filters=${encodeURIComponent(column_filters)}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const createPatient = async (data: CreatePatientFormValues) => {
    try {
        const response = await api.post('/patients', data);
        return response.data;
    } catch (error) {
        throw error;
    }
}
export const deactivatePatientUser = async (patientId: string) => {
    try {
        const response = await api.post(`/config/patients/${patientId}/deactivate`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const activatePatientUser = async (patientId: string) => {
    try {
        const response = await api.post(`/config/patients/${patientId}/activate`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const editPatient = async (patientId: string, updatedData: Partial<CreatePatientFormValues>) => {
    try {
        const response = await api.put(`/patients/${patientId}`, updatedData);
        return response.data;
    } catch (error) {
        console.error('🔴 EDIT Patient - Error:', error);
        throw error;
    }
}
export const getHistoryPatient = async ({ patientId }: { patientId: string }) => {
    try {
        const response = await api.get(`/patients/${patientId}/history`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const createPatientUser = async (patientGuid: string) => {
    try {
        const response = await api.post(`/patients/${patientGuid}/create-user`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const postViewImagenDicom = async ({ imageId, userId }: { imageId?: string, userId?: string }) => {

    try {
        const response = await api.post(`/general/viewer-url`, {
            user_id: userId,
            examination_id: imageId,
        });
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export const toggleExamVisibility = async (examGuid: string) => {
    try {
        const response = await api.put(`/patients/examination/${examGuid}/toggle-visibility`);
        return response.data;
    } catch (error) {
        throw error;
    }
}