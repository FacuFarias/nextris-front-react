import type { EstudiosNoVinculados, LinkedStudiesResponse, SearchExams, UnlinkStudyPayload } from "../types/cargar-estudios.types";
import { api } from "@/lib/api";

export const uploadFiles = async (files: File) => {
    const formData = new FormData();
    formData.append('file', files);
    try {
        const response = await api.post("/manual/upload", formData, { timeout: 300000 });
        return response.data;
    } catch (error) {
        throw error;
    }
}


export const getUnlinkedStudies = async ({
    include_linked,
    include_pacs,
}: {
    include_linked?: boolean,
    include_pacs?: boolean,
}) => {
    try {
        const response = await api.get<EstudiosNoVinculados>("/manual/unlinked-studies", {
            params: {
                include_linked: include_linked ? 1 : 0,
                include_pacs: include_pacs === false ? 0 : 1,
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getSearchExams = async ({ patient_name, patient_id, accession, date_from, date_to }: { patient_name?: string, patient_id?: string, accession?: string, date_from?: string, date_to?: string } = {}) => {
    try {
        const response = await api.get<SearchExams>("/dicom/search-examinations", { params: { patient_name, patient_id, accession, date_from, date_to } });
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

export const getLinkedStudies = async () => {
    try {
        const response = await api.get<LinkedStudiesResponse>("/dicom/linked-studies");
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
