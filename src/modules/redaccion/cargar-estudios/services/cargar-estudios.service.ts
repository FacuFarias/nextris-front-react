import { api } from "@/lib/api";
import type { EstudiosNoVinculados } from "../types/cargar-estudios.types";

export const uploadFiles = async (files: File, location_id: string) => {
    const formData = new FormData();
    formData.append('file', files);
    formData.append('location_id', location_id);
    try {
        const response = await api.post("/dicom/upload", formData);
        return response.data;
    } catch (error) {
        throw error;
    }
}


export const getUnlinkedStudies = async ({ location_id }: { location_id: string }) => {
    try {
        const response = await api.get<EstudiosNoVinculados>("/dicom/unlinked-studies", { params: { location_id } });
        return response.data;
    } catch (error) {
        throw error;
    }
}


