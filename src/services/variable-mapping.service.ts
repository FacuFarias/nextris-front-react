import { api } from "@/lib/api";

export interface VariableDefinitionOption {
  id: number;
  canonical_code: string;
  canonical_name: string;
  unit?: string | null;
  value_type?: string | null;
  active: boolean;
}

export interface VariableMappingItem {
  id: number;
  parser_family: string;
  source_parser_family?: string;
  parser_key: string;
  semantic_signature?: string | null;
  source_type?: string | null;
  facility_id?: string | null;
  facility_name?: string | null;
  facility_code?: string | null;
  concept_code_meaning?: string | null;
  concept_code_value?: string | null;
  concept_code_scheme?: string | null;
  base_variable_id?: number | null;
  canonical_code: string;
  canonical_name: string;
  unit?: string | null;
  active: boolean;
  mapping_scope?: string;
  requested_parser_family?: string;
  effective_parser_family?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface VariableMappingsResponse {
  items: VariableMappingItem[];
  fallbackMode: string;
  sourceTable?: string;
}

export interface CreateVariableMappingPayload {
  parser_manifest_id: number;
  facility_guid: string;
  canonical_variable_definition_id: number;
  concept_code_value?: string;
  concept_code_scheme?: string;
  dicom_path_pattern?: string;
  facility_description?: string;
  facility_name?: string;
  facility_code?: string;
  active?: boolean;
}

export interface UpdateVariableMappingPayload {
  canonical_variable_definition_id: number;
  concept_code_value?: string;
  concept_code_scheme?: string;
  dicom_path_pattern?: string;
  facility_description?: string;
  facility_name?: string;
  facility_code?: string;
  active?: boolean;
}

export const variableMappingService = {
  listVariableDefinitions: async (active = true): Promise<VariableDefinitionOption[]> => {
    const response = await api.get(`/structured-reports/variable-definitions?active=${active}`);
    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    return data.map((item: any) => ({
      id: Number(item.id),
      canonical_code: String(item.canonical_code || ""),
      canonical_name: String(item.canonical_name || ""),
      unit: item.unit ? String(item.unit) : null,
      value_type: item.value_type ? String(item.value_type) : null,
      active: Boolean(item.active),
    }));
  },

  listMappings: async (parserFamily: string, facilityId: string): Promise<VariableMappingsResponse> => {
    const response = await api.get(
      `/structured-reports/variable-mappings?parser_family=${encodeURIComponent(parserFamily)}&facility_id=${encodeURIComponent(facilityId)}`
    );
    return {
      items: Array.isArray(response.data?.data) ? response.data.data : [],
      fallbackMode: String(response.data?.fallback_mode || "specific"),
      sourceTable: response.data?.source_table ? String(response.data.source_table) : undefined,
    };
  },

  createMapping: async (payload: CreateVariableMappingPayload) => {
    const response = await api.post("/structured-reports/variable-mappings", payload);
    return response.data;
  },

  updateMapping: async (mappingId: number, payload: UpdateVariableMappingPayload) => {
    const response = await api.put(`/structured-reports/variable-mappings/${mappingId}`, payload);
    return response.data;
  },

  deleteMapping: async (mappingId: number) => {
    const response = await api.delete(`/structured-reports/variable-mappings/${mappingId}`);
    return response.data;
  },
};
