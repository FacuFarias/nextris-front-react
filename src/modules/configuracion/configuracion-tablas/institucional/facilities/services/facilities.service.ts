import { api } from '@/lib/api';
import type { Facility, FacilityFormData, FacilityResponse } from '../types/facilities.types';

const mapFacilityFormToApiPayload = (
    facilityData: Partial<FacilityFormData>,
    options?: { includeCodeFallback?: boolean }
) => {
    const description = facilityData.description?.trim();

    return {
        // El backend usa name/code; en UI el campo principal sigue siendo "description".
        ...(description ? { name: description } : {}),
        ...(options?.includeCodeFallback && description ? { code: description.toUpperCase().slice(0, 20) } : {}),

        id_patientdomain: facilityData.id_patientdomain || undefined,

        // SMTP
        smtp_server: facilityData.smtp_server,
        smtp_port: facilityData.smtp_port,
        smtp_user: facilityData.smtp_user,
        smtp_password: facilityData.smtp_password,
        smtp_from: facilityData.smtp_from,
        smtp_from_name: facilityData.smtp_from_name,
        use_tls: facilityData.smtp_use_tls,

        // Backend
        db_user: facilityData.backend_db_user,
        db_password: facilityData.backend_db_password,
        db_host: facilityData.backend_db_host,
        db_port: facilityData.backend_db_port,
        db_name: facilityData.backend_db_name,
        base_folder: facilityData.backend_base_folder,
        ipserver: facilityData.backend_ipserver,

        // WhatsApp
        whatsapp_api_url: facilityData.whatsapp_api_url,
        whatsapp_api_token: facilityData.whatsapp_token,
        whatsapp_phone_number_id: facilityData.whatsapp_phone_number_id,
        whatsapp_business_account_id: facilityData.whatsapp_business_account_id,
        whatsapp_webhook_verify_token: facilityData.whatsapp_webhook_verify_token,
        whatsapp_is_active: facilityData.whatsapp_is_active,
    };
};

export const facilitiesService = {
    getAll: async (): Promise<FacilityResponse> => {
        const response = await api.get('/config/facilities');
        return response.data;
    },
    create: async (facilityData: FacilityFormData): Promise<Facility> => {
        const payload = mapFacilityFormToApiPayload(facilityData, { includeCodeFallback: true });
        const { data } = await api.post('/config/facilities', payload);
        return data;
    },

    update: async (id: string, facilityData: Partial<FacilityFormData>): Promise<Facility> => {
        const payload = mapFacilityFormToApiPayload(facilityData);
        const { data } = await api.put(`/config/facilities/${id}`, payload);
        return data;
    },
    /*    getById: async (id: string): Promise<Facility> => {
           const { data } = await api.get(`/config/facilities/${id}`);
           return data;
       },
   
     
   
       delete: async (id: string): Promise<void> => {
           await api.delete(`/config/facilities/${id}`);
       }, */
};
