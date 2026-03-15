import { api } from "@/lib/api";

export interface ParserFacilityRelation {
  id: number;
  parser_manifest_id: number;
  parser_name: string;
  parser_version: string;
  facility_guid: string;
  facility_name: string;
  facility_code?: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ParserStudytypeRelation {
  id: number;
  parser_manifest_id: number;
  parser_name: string;
  parser_version: string;
  studytype_guid: string;
  studytype_description: string;
  studytype_code?: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface FacilityOption {
  guid: string;
  name: string;
  code?: string;
}

export interface StudytypeOption {
  guid: string;
  description: string;
  code?: string;
}

export interface ParserOption {
  id: number;
  parser_name: string;
  parser_version: string;
  parser_family: string;
}

export const parserFacilityRelService = {
  listRelations: async (parserManifestId?: number): Promise<ParserFacilityRelation[]> => {
    const query = parserManifestId ? `?parser_manifest_id=${parserManifestId}` : "";
    const response = await api.get(`/structured-reports/parser-facility-relations${query}`);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  createRelation: async (payload: { parser_manifest_id: number; facility_guid: string }) => {
    const response = await api.post("/structured-reports/parser-facility-relations", payload);
    return response.data;
  },

  syncRelations: async (payload: { parser_manifest_id: number; facility_guids: string[] }) => {
    const response = await api.put("/structured-reports/parser-facility-relations/sync", payload);
    return response.data;
  },

  deleteRelation: async (relationId: number) => {
    const response = await api.delete(`/structured-reports/parser-facility-relations/${relationId}`);
    return response.data;
  },

  listStudytypeRelations: async (parserManifestId?: number): Promise<ParserStudytypeRelation[]> => {
    const query = parserManifestId ? `?parser_manifest_id=${parserManifestId}` : "";
    const response = await api.get(`/structured-reports/parser-studytype-relations${query}`);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  createStudytypeRelation: async (payload: { parser_manifest_id: number; studytype_guid: string }) => {
    const response = await api.post("/structured-reports/parser-studytype-relations", payload);
    return response.data;
  },

  syncStudytypeRelations: async (payload: { parser_manifest_id: number; studytype_guids: string[] }) => {
    const response = await api.put("/structured-reports/parser-studytype-relations/sync", payload);
    return response.data;
  },

  deleteStudytypeRelation: async (relationId: number) => {
    const response = await api.delete(`/structured-reports/parser-studytype-relations/${relationId}`);
    return response.data;
  },

  listFacilities: async (): Promise<FacilityOption[]> => {
    const response = await api.get("/config/facilities");
    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    return data
      .filter((item: any) => !!item?.guid)
      .map((item: any) => ({
        guid: String(item.guid),
        name: String(item.name || item.description || ""),
        code: item.code ? String(item.code) : undefined,
      }));
  },

  listStudyTypes: async (): Promise<StudytypeOption[]> => {
    const response = await api.get("/config/study-types");
    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    return data
      .filter((item: any) => !!item?.guid)
      .map((item: any) => ({
        guid: String(item.guid),
        description: String(item.description || ""),
        code: item.code ? String(item.code) : undefined,
      }));
  },

  listParsers: async (): Promise<ParserOption[]> => {
    const response = await api.get("/structured-reports/parsers");
    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    return data.map((item: any) => ({
      id: Number(item.id),
      parser_name: String(item.parser_name || ""),
      parser_version: String(item.parser_version || ""),
      parser_family: String(item.parser_family || ""),
    }));
  },
};
