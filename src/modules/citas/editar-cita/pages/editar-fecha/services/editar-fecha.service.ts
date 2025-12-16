import { api } from "@/lib/api";


interface ReprogramarCitaData {
    id_cita: string;
    start: string;
    end: string;
}


export const postReprogramarCita = async ({ data }: { data: ReprogramarCitaData }) => {
    try {
        const response = await api.patch(`/appointments/${data.id_cita}/reschedule`, { start: data.start, end: data.end });
        return response.data;
    } catch (error) {
        throw error;
    }

}