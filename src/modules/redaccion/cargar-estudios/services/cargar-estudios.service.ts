import axios from "axios";
import type { EstudiosNoVinculados, SearchExams } from "../types/cargar-estudios.types";
import { api } from "@/lib/api";

// Crear instancia de axios SIN autenticación para estas rutas específicas
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiNoAuth = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

export const uploadFiles = async (files: File, location_id: string) => {
    const formData = new FormData();
    formData.append('file', files);
    formData.append('location_id', location_id);
    try {
        const response = await apiNoAuth.post("/manual/upload", formData);
        return response.data;
    } catch (error) {
        throw error;
    }
}


export const getUnlinkedStudies = async ({ location_id }: { location_id: string }) => {
    try {
        const response = await apiNoAuth.get<EstudiosNoVinculados>("/manual/unlinked-studies", { params: { location_id } });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getSearchExams = async ({ location_id, patient_name, patient_id, accession, date_from, date_to }: { location_id: string, patient_name?: string, patient_id?: string, accession?: string, date_from?: string, date_to?: string }) => {
    try {
        const response = await api.get<SearchExams>("/dicom/search-examinations", { params: { location_id, patient_name, patient_id, accession, date_from, date_to } });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const postVinculacion = async ({ upload_guid, examination_guid }: { upload_guid: string, examination_guid: string }) => {
    try {
        const response = await api.post("dicom/link-study", { upload_guid, examination_guid });
        return response.data;
    } catch (error) {
        throw error;
    }
}

