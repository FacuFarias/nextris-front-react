import { api } from '@/lib/api';
import type { TagFormData, TagsResponse } from '../types/tags.types';

export const tagsService = {
  getByFacility: async (facilityId: string, includeInactive = false): Promise<TagsResponse> => {
    const params: Record<string, string> = { facility_id: facilityId };
    if (includeInactive) params.include_inactive = 'true';
    const response = await api.get('/tags', { params });
    return response.data;
  },

  create: async (data: TagFormData): Promise<{ success: boolean; data: { guid: string } }> => {
    const response = await api.post('/tags', data);
    return response.data;
  },

  update: async (tagId: string, data: Partial<TagFormData>): Promise<{ success: boolean }> => {
    const response = await api.put(`/tags/${tagId}`, data);
    return response.data;
  },

  delete: async (tagId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/tags/${tagId}`);
    return response.data;
  },
};
