import { api } from "@/lib/api";
import type { PatientProfileResponse, UpdateProfilePayload } from "../types";

export const misDatosService = {
    /**
     * Obtiene el perfil completo del paciente autenticado
     */
    getProfile: async (): Promise<PatientProfileResponse> => {
        const response = await api.get<PatientProfileResponse>("/patient-portal/my-profile");
        return response.data;
    },

    /**
     * Actualiza los datos de contacto y dirección del paciente
     */
    updateProfile: async (payload: UpdateProfilePayload): Promise<PatientProfileResponse> => {
        const response = await api.put<PatientProfileResponse>(
            "/patient-portal/my-profile",
            payload
        );
        return response.data;
    },
};
