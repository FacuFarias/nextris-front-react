import { api } from '@/lib/api';
import type { Patient, PatientFormData, PatientResponse } from '../types/patients.types';

export const patientService = {
    getAll: async (includeInactive: boolean = false): Promise<PatientResponse> => {
        const params = includeInactive ? { include_inactive: true } : {};
        const response = await api.get('/config/patients', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Patient> => {
        const response = await api.get(`/config/patients/${id}`);
        return response.data;
    },

    create: async (patientData: PatientFormData): Promise<Patient> => {
        const response = await api.post('/config/patients', patientData);
        return response.data;
    },

    update: async (id: string, patientData: Partial<PatientFormData>): Promise<Patient> => {
        const response = await api.put(`/config/patients/${id}`, patientData);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/patients/${id}`);
    },

    activate: async (id: string): Promise<void> => {
        await api.post(`/config/patients/${id}/activate`);
    },

    deactivate: async (id: string): Promise<void> => {
        await api.post(`/config/patients/${id}/deactivate`);
    },

    resetPassword: async (id: string, newPassword: string): Promise<void> => {
        await api.post(`/config/patients/${id}/reset-password`, { new_password: newPassword });
    },
};
