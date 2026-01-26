import { api } from "@/lib/api";

export const postUnificacionPaciente = async ({ master_guid, duplicate_guid }: { master_guid: string; duplicate_guid: string }) => {
    try {
        const response = await api.post('patients/merge', {
            master_guid,
            duplicate_guid
        });
        return response.data;
    } catch (error) {
        throw error;
    }

}