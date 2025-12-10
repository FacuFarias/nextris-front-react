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