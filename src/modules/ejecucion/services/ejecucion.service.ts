import { api } from "@/lib/api"

export const getEjecucion = async () => {
    try {
        const response = await api.get(`/executions/orders`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getStudyTypes = async () => {
    try {
        const response = await api.get(`/config/study-types`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateExaminationStudyType = async (examGuid: string, studyTypeId: string) => {
    try {
        const response = await api.patch(`/executions/examination/${examGuid}/study-type`, {
            study_type_id: studyTypeId
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}