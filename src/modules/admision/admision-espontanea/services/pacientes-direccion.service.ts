import { api } from "@/lib/api";

export const postPacientesDireccion = async ({ uuid, searchTerm }: { uuid: string; searchTerm?: string }) => {
    try {
        const response = await api.post('/patients/by-location', {
            location_id: uuid,
            search_term: searchTerm
        });
        return response.data;
    } catch (error) {
        throw error;
    }

}

export const postPacientesFast = async ({ data }: { data: any }) => {
    try {
        const response = await api.post('/patients/quick', data);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

export const creatOrderForPatient = async ({ data }: { data: any }) => {
    try {
        const response = await api.post(`/admission/create-order`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
}