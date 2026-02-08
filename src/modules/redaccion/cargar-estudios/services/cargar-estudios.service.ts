import axios from "axios";
import type { EstudiosNoVinculados } from "../types/cargar-estudios.types";

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


