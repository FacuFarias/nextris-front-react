import { api } from "@/lib/api";

export interface StructuredCriterion {
  id: number;
  parser_manifest_id: number;
  parser_name: string;
  parser_version: string;
  parser_family: string;
  criterion_name: string;
  rule_definition: Record<string, any>;
  output_text: string;
  priority: number;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CriterionEvaluationPayload {
  parser_manifest_id: number;
  variables: Record<string, any>;
}

export interface CriterionEvaluationResult {
  matches: Array<{
    criterion_id: number;
    criterion_name: string;
    output_text: string;
    priority: number;
    branch?: "then" | "else" | "none";
  }>;
  evaluated_items?: Array<{
    criterion_id: number;
    criterion_name: string;
    output_text: string;
    priority: number;
    matched: boolean;
    branch: "then" | "else" | "none";
  }>;
  composed_output: string;
}

export interface ParserCriterionVariable {
  variable_key: string;
  variable_name: string;
  canonical_code?: string | null;
  unit?: string | null;
  source_type?: string | null;
  semantic_signature?: string | null;
  segments?: string[];
}

export interface ParserVariableTreeNode {
  id: string;
  label: string;
  type: "group" | "variable";
  path?: string;
  children_count?: number;
  children?: ParserVariableTreeNode[];
  metadata?: {
    variable_key?: string;
    variable_name?: string;
    canonical_code?: string | null;
    unit?: string | null;
    source_type?: string | null;
    semantic_signature?: string | null;
  } | null;
}

export interface ParserVariableTreeResponse {
  parser_manifest_id: number;
  parser_family: string;
  nodes: ParserVariableTreeNode[];
  total_variables: number;
}

export const criteriaService = {
  list: async (parserManifestId?: number, includeInactive = true): Promise<StructuredCriterion[]> => {
    const query: string[] = [];
    if (parserManifestId) {
      query.push(`parser_manifest_id=${parserManifestId}`);
    }
    query.push(`include_inactive=${includeInactive}`);
    const suffix = query.length > 0 ? `?${query.join("&")}` : "";

    const response = await api.get(`/structured-reports/criteria${suffix}`);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  create: async (payload: {
    parser_manifest_id: number;
    criterion_name: string;
    rule_definition: Record<string, any>;
    output_text: string;
    priority?: number;
    active?: boolean;
  }) => {
    const response = await api.post("/structured-reports/criteria", payload);
    return response.data;
  },

  update: async (
    criterionId: number,
    payload: {
      criterion_name: string;
      rule_definition: Record<string, any>;
      output_text: string;
      priority?: number;
      active?: boolean;
    }
  ) => {
    const response = await api.put(`/structured-reports/criteria/${criterionId}`, payload);
    return response.data;
  },

  delete: async (criterionId: number) => {
    const response = await api.delete(`/structured-reports/criteria/${criterionId}`);
    return response.data;
  },

  evaluate: async (payload: CriterionEvaluationPayload): Promise<CriterionEvaluationResult> => {
    const response = await api.post("/structured-reports/criteria/evaluate", payload);
    return response.data?.data || { matches: [], composed_output: "" };
  },

  listParserVariables: async (parserManifestId: number): Promise<ParserCriterionVariable[]> => {
    const response = await api.get(`/structured-reports/parser-variables?parser_manifest_id=${parserManifestId}`);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  listParserVariableTree: async (
    parserManifestId: number,
    options?: { search?: string; sourceType?: string }
  ): Promise<ParserVariableTreeResponse> => {
    const query = new URLSearchParams();
    if (options?.search) {
      query.set("search", options.search);
    }
    if (options?.sourceType) {
      query.set("source_type", options.sourceType);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await api.get(`/structured-reports/parsers/${parserManifestId}/variables/tree${suffix}`);
    return response.data?.data || { parser_manifest_id: parserManifestId, parser_family: "", nodes: [], total_variables: 0 };
  },

  getVariableNode: async (parserManifestId: number, nodeId: string): Promise<ParserVariableTreeNode | null> => {
    const response = await api.get(
      `/structured-reports/variables/nodes/${encodeURIComponent(nodeId)}?parser_manifest_id=${parserManifestId}`
    );
    return response.data?.data || null;
  },

  getVariableNodeChildren: async (parserManifestId: number, nodeId: string): Promise<ParserVariableTreeNode[]> => {
    const response = await api.get(
      `/structured-reports/variables/nodes/${encodeURIComponent(nodeId)}/children?parser_manifest_id=${parserManifestId}`
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  resolveVariableNode: async (payload: { parser_manifest_id: number; node_id: string }) => {
    const response = await api.post("/structured-reports/variables/resolve", payload);
    return response.data?.data;
  },
};
