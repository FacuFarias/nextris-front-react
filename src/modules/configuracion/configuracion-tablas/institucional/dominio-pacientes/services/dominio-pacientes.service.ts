import { api } from "@/lib/api";
import type {
    DominioPaciente,
    DominioPacienteFormData,
    DominioPacienteResponse,
} from "../types/dominio-pacientes.types";

export const dominioPacientesService = {
    getAll: async (): Promise<DominioPacienteResponse> => {
        const response = await api.get("/config/patient-domains");
        return response.data;
    },

    getById: async (id: string): Promise<DominioPaciente> => {
        const response = await api.get(`/config/patient-domains/${id}`);
        return response.data;
    },

    create: async (data: DominioPacienteFormData): Promise<DominioPaciente> => {
        const response = await api.post("/config/patient-domains", data);
        return response.data;
    },

    update: async (id: string, data: Partial<DominioPacienteFormData>): Promise<DominioPaciente> => {
        const response = await api.put(`/config/patient-domains/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/patient-domains/${id}`);
    },
};
