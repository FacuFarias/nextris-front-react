import { api } from '@/lib/api';

export interface AppConfig {
  id: number;
  name: string;
  code: string | null;
  email: string | null;
  contact_person: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  smtp_server: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_from: string | null;
  smtp_from_name: string | null;
  use_tls: boolean;
  whatsapp_api_url: string | null;
  whatsapp_phone_number_id: string | null;
  whatsapp_business_account_id: string | null;
  whatsapp_is_active: boolean;
  plan_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AppConfigUpdate {
  name?: string;
  code?: string;
  email?: string;
  contact_person?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  smtp_server?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_from?: string;
  smtp_from_name?: string;
  use_tls?: boolean;
  whatsapp_api_url?: string;
  whatsapp_api_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_business_account_id?: string;
  whatsapp_webhook_verify_token?: string;
  whatsapp_is_active?: boolean;
  plan_id?: string;
}

export const getAppConfig = async (): Promise<AppConfig> => {
  const response = await api.get('/app-config');
  return response.data.data;
};

export const updateAppConfig = async (data: AppConfigUpdate): Promise<AppConfig> => {
  const response = await api.put('/app-config', data);
  return response.data.data;
};

export const getAppModules = async () => {
  const response = await api.get('/app-config/modules');
  return response.data.data;
};

export const updateAppModule = async (moduleId: string, isActive: boolean) => {
  const response = await api.put(`/app-config/modules/${moduleId}`, { is_active: isActive });
  return response.data.data;
};
