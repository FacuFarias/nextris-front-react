import { api } from "@/lib/api";
import type {
    ObraSocial,
    ObraSocialFormData,
    ObraSocialResponse,
    InsuranceLocationsResponse,
} from "../types/obras-sociales.types";

export const obrasSocialesService = {
    getAll: async (): Promise<ObraSocialResponse> => {
        const response = await api.get("/config/insurances");
        return response.data;
    },

    getById: async (id: string): Promise<ObraSocial> => {
        const response = await api.get(`/config/insurances/${id}`);
        return response.data;
    },

    create: async (data: ObraSocialFormData): Promise<ObraSocial> => {
        const response = await api.post("/config/insurances", data);
        return response.data;
    },

    update: async (id: string, data: Partial<ObraSocialFormData>): Promise<ObraSocial> => {
        const response = await api.put(`/config/insurances/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/config/insurances/${id}`);
    },

    // Relación con locations
    getLocations: async (insuranceId: string): Promise<InsuranceLocationsResponse> => {
        const response = await api.get(`/config/insurances/${insuranceId}/locations`);
        return response.data;
    },

    setLocations: async (insuranceId: string, locationIds: string[]): Promise<void> => {
        await api.put(`/config/insurances/${insuranceId}/locations`, { location_ids: locationIds });
    },
};
