import { api } from "@/lib/api";
import type { CreatePatientFormValues } from "../schemas/create-patient.schema";

export const getAllPacientes = async ({ page = 1, per_page = 8, search = "" }) => {
    try {
        const response = await api.get(`/patients?page=${page}&per_page=${per_page}&search=${search}`);
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

export const getHistoryPatient = async ({ patientId }: { patientId: string }) => {
    try {
        const response = await api.get(`/patients/${patientId}/history`);
        return response.data;
    } catch (error) {
        throw error;
    }
}