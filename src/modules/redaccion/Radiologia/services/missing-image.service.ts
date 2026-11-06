import { api } from "@/lib/api";

export interface MissingImageCandidate {
    pacs_study_pk: number;
    study_instance_uid: string;
    accession_number: string | null;
    study_date: string | null;
    study_time: string | null;
    study_description: string;
    patient_name: string;
    modality: string;
    series_count: number;
    instance_count: number;
    accession_matches: boolean;
}

export interface MissingImageCandidatesResponse {
    success: boolean;
    message?: string;
    data: {
        examination: {
            guid: string;
            accession_number: string | null;
            patient_id: string | null;
            patient_name: string;
        };
        candidates: MissingImageCandidate[];
    };
}

export const getMissingImageCandidates = async (examinationGuid: string) => {
    const response = await api.get<MissingImageCandidatesResponse>(
        `/dicom/missing-image-candidates?examination_guid=${encodeURIComponent(examinationGuid)}`,
    );
    return response.data;
};

export const linkMissingImage = async (examinationGuid: string, pacsStudyPk: number) => {
    const response = await api.post<{
        success: boolean;
        message?: string;
        data?: {
            examination_guid: string;
            pacs_study_pk: number;
            study_instance_uid: string;
        };
    }>("/dicom/link-missing-image", {
        examination_guid: examinationGuid,
        pacs_study_pk: pacsStudyPk,
    });
    return response.data;
};
