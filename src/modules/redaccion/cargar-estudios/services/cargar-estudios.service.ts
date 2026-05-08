import axios from "axios";
import type { EstudiosNoVinculados, LinkedStudiesResponse, SearchExams, UnlinkStudyPayload } from "../types/cargar-estudios.types";
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


export const getUnlinkedStudies = async ({
    location_id,
    include_linked,
    include_pacs,
}: {
    location_id: string,
    include_linked?: boolean,
    include_pacs?: boolean,
}) => {
    try {
        const response = await apiNoAuth.get<EstudiosNoVinculados>("/manual/unlinked-studies", {
            params: {
                location_id,
                include_linked: include_linked ? 1 : 0,
                include_pacs: include_pacs === false ? 0 : 1,
            }
        });
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

export const postVinculacion = async ({ upload_guid, examination_guid, pacs_study_pk, study_instance_uid }: { upload_guid?: string, examination_guid: string, pacs_study_pk?: number, study_instance_uid?: string }) => {
    try {
        const payload: Record<string, string | number> = { examination_guid };

        if (upload_guid) {
            payload.upload_guid = upload_guid;
        }

        if (typeof pacs_study_pk === 'number') {
            payload.pacs_study_pk = pacs_study_pk;
        }

        if (study_instance_uid) {
            payload.study_instance_uid = study_instance_uid;
        }

        const response = await api.post("dicom/link-study", payload);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getLinkedStudies = async ({ location_id }: { location_id: string }) => {
    try {
        const response = await api.get<LinkedStudiesResponse>("/dicom/linked-studies", { params: { location_id } });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const postDesvinculacion = async (payload: UnlinkStudyPayload) => {
    try {
        const response = await api.post("/dicom/unlink-study", payload);
        return response.data;
    } catch (error) {
        throw error;
    }
}

