import { api } from "@/lib/api";



export const postObtenerEventosPrevios = async ({ data }: { data: any }) => {

    try {
        const response = await api.post(`/appointments/calendar-events`, data.data);
        return response.data;
    } catch (error) {
        throw error;
    }
}