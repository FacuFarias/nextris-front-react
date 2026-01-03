import { api } from "@/lib/api";

export const getAdminsionCitaAll = async () => {
    const response = await api.get(`/appointments_to_admit`);

    return response.data;
};

// Obtener datos detallados para la admisión
export const getAdmisionDetailData = async (guid: string | undefined) => {
    const response = await api.get(`/admissions/${guid}`);
    return response.data;
};

// Confirmar la admisión de una cita
export const postConfirmAdmision = async (guid: string | undefined, data?: any) => {

    const response = await api.post(`/admissions/appointment/${guid}/admit`, data);
    return response.data;
};