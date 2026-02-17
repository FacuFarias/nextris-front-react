import { api } from "@/lib/api";

interface CalendarEvent {
    exam_id: string;
    start_datetime: string;
    end_datetime: string;
    physician_id: string | null;
    obra_social_id: string | null;
    equipment_id: string;
}

interface CrearCitaData {
    patient_id: string;
    appointment_type: string;
    location_id?: string;
    calendar_events: CalendarEvent[];
}

interface ActualizarCitaData {
    doctor_id?: string;
    requesting_physician_id?: string;
    exam_id?: string;
}

export const crearCita = async (data: CrearCitaData) => {
    const response = await api.post('/appointments', data);
    return response.data;
};


export const getCitas = async ({ page, per_page, search }: { page: number, per_page: number, search: string }) => {
    const response = await api.get(`/appointments?per_page=${per_page}&page=${page}&search=${search}`);
    return response.data;
};

export const actualizarCita = async (appointmentId: string, data: ActualizarCitaData) => {
    const response = await api.patch(`/appointments/${appointmentId}`, data);
    return response.data;
};