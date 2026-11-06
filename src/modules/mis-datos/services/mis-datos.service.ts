import { api } from "@/lib/api";
import type { PatientProfileResponse, UpdateProfilePayload } from "../types";

export const misDatosService = {
    sendEmailVerification: async () => {
        const response = await api.post<{ success: boolean; message: string }>("/patient-portal/email-verification/send", {}, { timeout: 30000 });
        return response.data;
    },
    confirmEmailVerification: async (code: string) => {
        const response = await api.post<{ success: boolean; message: string }>("/patient-portal/email-verification/confirm", { code });
        return response.data;
    },
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
        if (!response.data.success) {
            throw new Error("El perfil no se pudo actualizar");
        }
        return response.data;
    },
};
