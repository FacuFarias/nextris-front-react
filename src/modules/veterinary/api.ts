import { api } from '@/lib/api';
import { z } from 'zod';

export interface Choice { id: string; name: string; species_id?: string; code_value?: string; coding_scheme?: string }
export interface VeterinaryData { species_id: string | null; breed_id: string | null; species_name?: string; breed_name?: string; weight_kg: number | null; birthdate_estimated: boolean; reproductive_status: string }
export interface Animal { guid: string; patientid: string; name: string; surname?: string; birthdate: string | null; gender: string; veterinary: VeterinaryData; study_count: number; responsibles: { id: string; name: string }[] }
export interface Responsible { id: string; kind: string; name: string; email: string | null; phone: string | null; document: string | null; address?: string; organization?: string; is_active: boolean }
export interface Relationship { id: string; name: string; email: string; role: string; valid_from: string; valid_to: string | null; portal_authorized: boolean; is_primary: boolean }
export interface ClinicalEntry { id: string; category: string; note: string; weight_kg: number | null; recorded_at: string; created_by: string }
export interface Protocol { id: string; name: string; preparation: string; species_id: string | null; study_type_id: string | null; checklist: string[]; min_weight_kg?: number | null; max_weight_kg?: number | null }
export interface Study { guid: string; localacc: string; createdon: string; study_type: string; isreported: number; has_images?: boolean; studyinstanceuid?: string; veterinary_context?: { protocol?: Protocol } }
export interface Template { guid: string; title: string; study_type_id: string | null; species_id: string | null; study_reason: string; content: string; conclusion: string }
export interface RefData { guid?: string; id?: string; description?: string; name?: string; code?: string }
export const animalSchema = z.object({ name: z.string().trim().min(1, 'Indique el nombre del animal').max(100), birthdate: z.string(), gender: z.enum(['M','F','O']) });
export const get = async <T,>(path: string): Promise<T> => (await api.get<{data:T}>(path)).data.data;
export const post = async <T,>(path: string, data: unknown): Promise<T> => (await api.post<{data:T}>(path,data)).data.data;
export const put = async <T,>(path: string, data: unknown): Promise<T> => (await api.put<{data:T}>(path,data)).data.data;
