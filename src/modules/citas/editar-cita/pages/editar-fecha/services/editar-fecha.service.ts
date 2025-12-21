import { api } from "@/lib/api";


interface ReprogramarCitaData {
    id_cita: string;
    start_datetime: string;
    end_datetime: string;
    equipment_id?: string;
}


export const postReprogramarCita = async ({ data }: { data: ReprogramarCitaData }) => {
    try {
        const response = await api.patch(`/appointments/${data.id_cita}/reschedule`, { start_datetime: data.start_datetime, end_datetime: data.end_datetime, equipment_id: data.equipment_id });
        return response.data;
    } catch (error) {
        throw error;
    }

}