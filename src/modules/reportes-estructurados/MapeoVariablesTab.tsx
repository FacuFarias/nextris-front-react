import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, LocateFixed, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { TableAction, TableColumn } from "@/types/table";
import {
  parserFacilityRelService,
  type FacilityOption,
  type ParserOption,
} from "@/services/parser-facility-rel.service";
import { criteriaService, type ParserVariableTreeNode } from "@/services/criteria.service";
import {
  variableMappingService,
  type VariableDefinitionOption,
  type VariableMappingItem,
} from "@/services/variable-mapping.service";

interface NewMappingForm {
  canonical_variable_definition_id: string;
  concept_code_value: string;
  concept_code_scheme: string;
  dicom_path_pattern: string;
  facility_description: string;
  facility_name: string;
  facility_code: string;
  active: boolean;
}

const initialForm: NewMappingForm = {
  canonical_variable_definition_id: "",
  concept_code_value: "",
  concept_code_scheme: "",
  dicom_path_pattern: "",
  facility_description: "",
  facility_name: "",
  facility_code: "",
  active: true,
};

const normalizeKey = (value: string | null | undefined): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

interface LeafTreeEntry {
  node: ParserVariableTreeNode;
  parentIds: string[];
  semanticSignature: string;
  variableKey: string;
  variableName: string;
  label: string;
}

interface FlatTreeNodeEntry {
  node: ParserVariableTreeNode;
  parentIds: string[];
}

export const MapeoVariablesTab = () => {
  const [parsers, setParsers] = useState<ParserOption[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [definitions, setDefinitions] = useState<VariableDefinitionOption[]>([]);

  const [selectedParserId, setSelectedParserId] = useState<string>("");
  const [selectedFacilityGuid, setSelectedFacilityGuid] = useState<string>("");
  const [fallbackMode, setFallbackMode] = useState<string>("specific");

  const [mappings, setMappings] = useState<VariableMappingItem[]>([]);
  const [parserVariableTree, setParserVariableTree] = useState<ParserVariableTreeNode[]>([]);
  const [variableTreeSearch, setVariableTreeSearch] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState("");
  const [selectedTreeNodeMeta, setSelectedTreeNodeMeta] = useState<ParserVariableTreeNode["metadata"] | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [isLoadingParserVariables, setIsLoadingParserVariables] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<NewMappingForm>(initialForm);
  const [modalMode, setModalMode] = useState<"create" | "createFromGeneric" | "edit">("create");
  const [editingMappingId, setEditingMappingId] = useState<number | null>(null);
  const [modalVariableContext, setModalVariableContext] = useState<VariableMappingItem | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const canLoadMappings = Boolean(selectedParserId && selectedFacilityGuid);
  const selectedParser = useMemo(
    () => parsers.find((item) => String(item.id) === selectedParserId) || null,
    [parsers, selectedParserId]
  );
  const selectedFacility = useMemo(
    () => facilities.find((item) => item.guid === selectedFacilityGuid) || null,
    [facilities, selectedFacilityGuid]
  );

  const fallbackMessage = useMemo(() => {
    if (fallbackMode === "mixed_specific_generic_same_family") {
      return "Se muestran mapeos específicos de la facility y, para variables faltantes, mapeos genéricos del mismo parser_family.";
    }
    if (fallbackMode === "mixed_specific_generic_parser_family") {
      return "Se muestran mapeos específicos de la facility y, para variables faltantes, mapeos genéricos globales (generic_sr).";
    }
    if (fallbackMode === "generic_same_family") {
      return "No hay mapeos específicos para la facility seleccionada. Se muestran mapeos genéricos del mismo parser_family.";
    }
    if (fallbackMode === "generic_parser_family") {
      return "No hay mapeos específicos ni genéricos del parser_family. Se muestran mapeos genéricos globales (generic_sr).";
    }
    return "";
  }, [fallbackMode]);

  const loadContext = async () => {
    setIsLoadingContext(true);
    try {
      const [parserData, facilityData, definitionData] = await Promise.all([
        parserFacilityRelService.listParsers(),
        parserFacilityRelService.listFacilities(),
        variableMappingService.listVariableDefinitions(true),
      ]);
      setParsers(parserData);
      setFacilities(facilityData);
      setDefinitions(definitionData);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudieron cargar parser/facilities/variables");
    } finally {
      setIsLoadingContext(false);
    }
  };

  const loadMappings = async () => {
    if (!canLoadMappings) {
      setMappings([]);
      setFallbackMode("specific");
      return;
    }

    if (!selectedParser?.parser_family) {
      setMappings([]);
      toast.error("No se pudo resolver parser_family para el parser seleccionado");
      return;
    }

    setIsLoadingMappings(true);
    try {
      const response = await variableMappingService.listMappings(selectedParser.parser_family, selectedFacilityGuid);
      setMappings(response.items);
      setFallbackMode(response.fallbackMode);
    } catch (error: any) {
      setMappings([]);
      setFallbackMode("specific");
      toast.error(error?.response?.data?.error || "No se pudieron cargar los mapeos");
    } finally {
      setIsLoadingMappings(false);
    }
  };

  const loadParserVariables = async () => {
    if (!selectedParserId) {
      setParserVariableTree([]);
      setExpandedNodeIds({});
      setSelectedTreeNodeId("");
      setSelectedTreeNodeMeta(null);
      return;
    }

    setIsLoadingParserVariables(true);
    try {
      const treeResponse = await criteriaService.listParserVariableTree(Number(selectedParserId));
      setParserVariableTree(Array.isArray(treeResponse.nodes) ? treeResponse.nodes : []);
      setExpandedNodeIds(
        (treeResponse.nodes || []).reduce((acc, node) => {
          if (node.type === "group") {
            acc[node.id] = true;
          }
          return acc;
        }, {} as Record<string, boolean>)
      );
      setSelectedTreeNodeId("");
      setSelectedTreeNodeMeta(null);
    } catch (error: any) {
      setParserVariableTree([]);
      setExpandedNodeIds({});
      setSelectedTreeNodeId("");
      setSelectedTreeNodeMeta(null);
      toast.error(error?.response?.data?.error || "No se pudieron cargar variables del parser");
    } finally {
      setIsLoadingParserVariables(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    loadMappings();
  }, [selectedParserId, selectedFacilityGuid]);

  useEffect(() => {
    loadParserVariables();
  }, [selectedParserId]);

  useEffect(() => {
    setPage(1);
  }, [selectedTreeNodeId]);

  const toggleNodeExpanded = (nodeId: string) => {
    setExpandedNodeIds((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const filterTreeNodes = (nodes: ParserVariableTreeNode[], term: string): ParserVariableTreeNode[] => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return nodes;
    }

    const walk = (list: ParserVariableTreeNode[]): ParserVariableTreeNode[] => {
      const result: ParserVariableTreeNode[] = [];
      for (const node of list) {
        const label = String(node.label || "").toLowerCase();
        const variableKey = String(node.metadata?.variable_key || "").toLowerCase();
        const selfMatches = label.includes(normalized) || variableKey.includes(normalized);
        const children = Array.isArray(node.children) ? walk(node.children) : [];
        if (selfMatches || children.length > 0) {
          result.push({ ...node, children });
        }
      }
      return result;
    };

    return walk(nodes);
  };

  const filteredVariableTree = useMemo(
    () => filterTreeNodes(parserVariableTree, variableTreeSearch),
    [parserVariableTree, variableTreeSearch]
  );

  const treeLeafEntries = useMemo<LeafTreeEntry[]>(() => {
    const entries: LeafTreeEntry[] = [];

    const walk = (nodes: ParserVariableTreeNode[], parentIds: string[]) => {
      for (const node of nodes) {
        const isGroup = node.type === "group";
        if (isGroup) {
          const nextParents = [...parentIds, node.id];
          if (Array.isArray(node.children) && node.children.length > 0) {
            walk(node.children, nextParents);
          }
          continue;
        }

        entries.push({
          node,
          parentIds,
          semanticSignature: String(node.metadata?.semantic_signature || "").trim(),
          variableKey: normalizeKey(node.metadata?.variable_key),
          variableName: normalizeKey(node.metadata?.variable_name),
          label: normalizeKey(node.label),
        });
      }
    };

    walk(parserVariableTree, []);
    return entries;
  }, [parserVariableTree]);

  const flatTreeNodes = useMemo<FlatTreeNodeEntry[]>(() => {
    const items: FlatTreeNodeEntry[] = [];

    const walk = (nodes: ParserVariableTreeNode[], parentIds: string[]) => {
      for (const node of nodes) {
        items.push({ node, parentIds });
        if (node.type === "group" && Array.isArray(node.children) && node.children.length > 0) {
          walk(node.children, [...parentIds, node.id]);
        }
      }
    };

    walk(parserVariableTree, []);
    return items;
  }, [parserVariableTree]);

  const selectedTreeNode = useMemo(
    () => flatTreeNodes.find((item) => item.node.id === selectedTreeNodeId)?.node || null,
    [flatTreeNodes, selectedTreeNodeId]
  );

  const findTreeEntryForMapping = (row: VariableMappingItem): LeafTreeEntry | null => {
    const rowSemanticSignature = String(row.semantic_signature || "").trim();
    if (rowSemanticSignature) {
      const bySemantic = treeLeafEntries.find((entry) => entry.semanticSignature === rowSemanticSignature);
      if (bySemantic) {
        return bySemantic;
      }
    }

    const candidates = [
      normalizeKey(row.concept_code_meaning),
      normalizeKey(row.canonical_name),
      normalizeKey(row.parser_key),
    ].filter(Boolean);

    if (candidates.length === 0) {
      return null;
    }

    return (
      treeLeafEntries.find(
        (entry) =>
          candidates.includes(entry.variableKey) ||
          candidates.includes(entry.variableName) ||
          candidates.includes(entry.label)
      ) || null
    );
  };

  const focusTreeEntry = (entry: LeafTreeEntry) => {
    setExpandedNodeIds((prev) => {
      const next = { ...prev };
      for (const parentId of entry.parentIds) {
        next[parentId] = true;
      }
      return next;
    });
    setSelectedTreeNodeId(entry.node.id);
    setSelectedTreeNodeMeta(entry.node.metadata || null);
  };

  const renderTreeNodes = (nodes: ParserVariableTreeNode[], depth = 0) => {
    const leftPadding = 8 + depth * 14;

    return nodes.map((node) => {
      const isGroup = node.type === "group";
      const isExpanded = Boolean(expandedNodeIds[node.id]);

      return (
        <div key={node.id} className="space-y-1">
          <button
            type="button"
            className={
              isGroup
                ? `w-full rounded-md border px-2 py-1.5 text-left text-xs ${
                    selectedTreeNodeId === node.id
                      ? "border-brand-purple bg-brand-purple/10 dark:bg-brand-purple/30"
                      : "border-gray-200 dark:border-gray-700 bg-background/60 hover:border-brand-purple/60"
                  }`
                : `w-full rounded-md border px-2 py-1.5 text-left text-xs ${
                    selectedTreeNodeId === node.id
                      ? "border-brand-purple bg-brand-purple/10 dark:bg-brand-purple/30"
                      : "border-gray-200 bg-background hover:border-brand-purple/60 dark:border-gray-700"
                  }`
            }
            style={{ paddingLeft: `${leftPadding}px` }}
            onClick={() => {
              if (isGroup) {
                toggleNodeExpanded(node.id);
                setSelectedTreeNodeId(node.id);
                setSelectedTreeNodeMeta(null);
                return;
              }

              setSelectedTreeNodeId(node.id);
              setSelectedTreeNodeMeta(node.metadata || null);
            }}
          >
            <div className="flex items-center gap-1">
              {isGroup ? (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-purple" />
              )}
              <span className="truncate font-medium">{node.label}</span>
              {isGroup && <span className="ml-auto text-[10px] text-muted-foreground">{node.children_count || 0}</span>}
            </div>
            {!isGroup && (
              <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                key: {node.metadata?.variable_key}
                {node.metadata?.unit ? ` | ${node.metadata.unit}` : ""}
              </div>
            )}
          </button>

          {isGroup && isExpanded && Array.isArray(node.children) && node.children.length > 0 && (
            <div className="space-y-1">{renderTreeNodes(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  const filteredMappings = useMemo(() => {
    if (!selectedTreeNodeId) {
      return mappings;
    }

    const activeLeafEntries = treeLeafEntries.filter((entry) => {
      if (entry.node.id === selectedTreeNodeId) {
        return true;
      }
      return entry.parentIds.includes(selectedTreeNodeId);
    });

    if (activeLeafEntries.length === 0) {
      return mappings;
    }

    const semanticSignatureSet = new Set(
      activeLeafEntries.map((entry) => String(entry.semanticSignature || "").trim()).filter(Boolean)
    );

    const keySet = new Set<string>();
    for (const entry of activeLeafEntries) {
      if (entry.variableKey) keySet.add(entry.variableKey);
      if (entry.variableName) keySet.add(entry.variableName);
      if (entry.label) keySet.add(entry.label);
    }

    return mappings.filter((row) => {
      const rowSemanticSignature = String(row.semantic_signature || "").trim();
      if (semanticSignatureSet.size > 0) {
        if (rowSemanticSignature) {
          return semanticSignatureSet.has(rowSemanticSignature);
        }

        // Legacy rows without semantic_signature can still match by normalized key set.
        const rowConceptMeaning = normalizeKey(row.concept_code_meaning);
        const rowCanonicalName = normalizeKey(row.canonical_name);
        const rowParserKey = normalizeKey(row.parser_key);

        return (
          (rowConceptMeaning && keySet.has(rowConceptMeaning)) ||
          (rowCanonicalName && keySet.has(rowCanonicalName)) ||
          (rowParserKey && keySet.has(rowParserKey))
        );
      }

      const rowConceptMeaning = normalizeKey(row.concept_code_meaning);
      const rowCanonicalName = normalizeKey(row.canonical_name);
      const rowParserKey = normalizeKey(row.parser_key);

      return (
        (rowConceptMeaning && keySet.has(rowConceptMeaning)) ||
        (rowCanonicalName && keySet.has(rowCanonicalName)) ||
        (rowParserKey && keySet.has(rowParserKey))
      );
    });
  }, [mappings, selectedTreeNodeId, treeLeafEntries]);

  const columns: TableColumn<VariableMappingItem>[] = useMemo(
    () => [
      {
        key: "concept_code_meaning",
        label: "CONCEPT_CODE_MEANING",
        sortable: true,
        filterable: true,
        render: (value) => (
          <span className="inline-block max-w-[360px] truncate align-bottom" title={value || "-"}>
            {value || "-"}
          </span>
        ),
      },
      {
        key: "canonical_name",
        label: "CANONICAL__NAME",
        sortable: true,
        filterable: true,
        render: (value) => (
          <span className="inline-block max-w-[240px] truncate align-bottom" title={value || "-"}>
            {value || "-"}
          </span>
        ),
      },
      {
        key: "facility_name",
        label: "FACILITY_NAME",
        sortable: true,
        filterable: true,
        render: (value) => value || "-",
      },
      {
        key: "facility_code",
        label: "FACILITY_CODE",
        sortable: true,
        filterable: true,
        headerClassName: "w-[90px] max-w-[90px]",
        className: "w-[90px] max-w-[90px]",
        render: (value) => value || "-",
      },
      {
        key: "mapping_scope",
        label: "ORIGEN",
        sortable: true,
        filterable: true,
        headerClassName: "w-[120px] max-w-[120px]",
        className: "w-[120px] max-w-[120px]",
        render: (value: string | undefined) => {
          if (value === "specific") {
            return "Específico";
          }
          if (value === "generic_same_family") {
            return "Genérico (parser)";
          }
          if (value === "generic_parser_family") {
            return "Genérico (global)";
          }
          return "-";
        },
      },
      {
        key: "active",
        label: "ACTIVO",
        sortable: true,
        filterable: true,
        headerClassName: "w-[70px] max-w-[70px]",
        className: "w-[70px] max-w-[70px]",
        render: (value: boolean) => (value ? "Sí" : "No"),
      },
    ],
    []
  );

  const handleDelete = async (row: VariableMappingItem) => {
    try {
      await variableMappingService.deleteMapping(row.id);
      toast.success("Mapeo eliminado correctamente");
      loadMappings();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudo eliminar el mapeo");
    }
  };

  const isGenericRow = (row: VariableMappingItem) =>
    row.mapping_scope === "generic_same_family" || row.mapping_scope === "generic_parser_family";

  const resolveDefinitionId = (row: VariableMappingItem): string => {
    const byCode = definitions.find((item) => item.canonical_code === row.canonical_code);
    if (byCode) {
      return String(byCode.id);
    }
    const byName = definitions.find((item) => item.canonical_name === row.canonical_name);
    return byName ? String(byName.id) : "";
  };

  const handleOpenCreateFromGeneric = (row: VariableMappingItem) => {
    if (!canLoadMappings) {
      toast.error("Seleccione parser y facility");
      return;
    }

    setModalMode("createFromGeneric");
    setEditingMappingId(null);
    setModalVariableContext(row);
    setForm({
      canonical_variable_definition_id: resolveDefinitionId(row),
      concept_code_value: row.concept_code_value || "",
      concept_code_scheme: row.concept_code_scheme || "",
      dicom_path_pattern: "",
      facility_description: row.concept_code_meaning || "",
      facility_name: "",
      facility_code: selectedFacility?.code || "",
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditMapping = (row: VariableMappingItem) => {
    if (isGenericRow(row)) {
      toast.error("Solo se pueden editar mapeos específicos de la facility");
      return;
    }

    setModalMode("edit");
    setEditingMappingId(row.id);
    setModalVariableContext(row);
    setForm({
      canonical_variable_definition_id: resolveDefinitionId(row),
      concept_code_value: row.concept_code_value || "",
      concept_code_scheme: row.concept_code_scheme || "",
      dicom_path_pattern: "",
      facility_description: row.concept_code_meaning || "",
      facility_name: row.facility_name || selectedFacility?.name || "",
      facility_code: row.facility_code || selectedFacility?.code || "",
      active: Boolean(row.active),
    });
    setIsModalOpen(true);
  };

  const actions: TableAction<VariableMappingItem>[] = [
    {
      label: "Ver en el arbol",
      icon: <LocateFixed className="h-4 w-4 text-violet-500" />,
      onClick: (row) => {
        const entry = findTreeEntryForMapping(row);
        if (!entry) {
          toast.error("No se pudo ubicar esta variable en el arbol del parser");
          return;
        }
        focusTreeEntry(entry);
      },
      hidden: (row) => !findTreeEntryForMapping(row),
    },
    {
      label: "Crear mapeo",
      icon: <Plus className="h-4 w-4 text-indigo-600" />,
      onClick: handleOpenCreateFromGeneric,
      hidden: (row) => !isGenericRow(row),
    },
    {
      label: "Editar",
      icon: <Pencil className="h-4 w-4 text-blue-600" />,
      onClick: handleOpenEditMapping,
      hidden: (row) => isGenericRow(row),
    },
    {
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4 text-red-600" />,
      onClick: handleDelete,
      hidden: (row) => isGenericRow(row),
    },
  ];

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const handlePerPageChange = (value: number) => {
    setPage(1);
    setPageSize(value);
  };

  const handleSaveMapping = async () => {
    if (!selectedParserId || !selectedFacilityGuid) {
      toast.error("Seleccione parser y facility");
      return;
    }

    if (!form.canonical_variable_definition_id) {
      toast.error("Seleccione una variable canónica");
      return;
    }

    if (!form.concept_code_value && !form.concept_code_scheme && !form.dicom_path_pattern) {
      toast.error("Ingrese al menos una regla: Concept Value, Concept Scheme o DICOM Path");
      return;
    }

    setIsSaving(true);
    try {
      if (modalMode === "edit") {
        if (!editingMappingId) {
          toast.error("No se pudo resolver el mapeo a editar");
          return;
        }

        await variableMappingService.updateMapping(editingMappingId, {
          canonical_variable_definition_id: Number(form.canonical_variable_definition_id),
          concept_code_value: form.concept_code_value || undefined,
          concept_code_scheme: form.concept_code_scheme || undefined,
          dicom_path_pattern: form.dicom_path_pattern || undefined,
          facility_description: form.facility_description || undefined,
          facility_name: form.facility_name || undefined,
          facility_code: form.facility_code || undefined,
          active: form.active,
        });

        toast.success("Mapeo actualizado correctamente");
      } else {
        await variableMappingService.createMapping({
          parser_manifest_id: Number(selectedParserId),
          facility_guid: selectedFacilityGuid,
          canonical_variable_definition_id: Number(form.canonical_variable_definition_id),
          concept_code_value: form.concept_code_value || undefined,
          concept_code_scheme: form.concept_code_scheme || undefined,
          dicom_path_pattern: form.dicom_path_pattern || undefined,
          facility_description: form.facility_description || undefined,
          facility_name: form.facility_name || undefined,
          facility_code: form.facility_code || undefined,
          active: form.active,
        });

        toast.success("Mapeo creado correctamente");
      }

      setIsModalOpen(false);
      setEditingMappingId(null);
      setModalVariableContext(null);
      loadMappings();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          (modalMode === "edit" ? "No se pudo actualizar el mapeo" : "No se pudo crear el mapeo")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Parser</Label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
              value={selectedParserId}
              onChange={(event) => setSelectedParserId(event.target.value)}
              disabled={isLoadingContext}
            >
              <option value="">Seleccione un parser...</option>
              {parsers.map((parser) => (
                <option key={parser.id} value={parser.id}>
                  {parser.parser_name} ({parser.parser_version})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Facility</Label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
              value={selectedFacilityGuid}
              onChange={(event) => setSelectedFacilityGuid(event.target.value)}
              disabled={isLoadingContext}
            >
              <option value="">Seleccione una facility...</option>
              {facilities.map((facility) => (
                <option key={facility.guid} value={facility.guid}>
                  {facility.code ? `${facility.name} (${facility.code})` : facility.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-w-full overflow-hidden">
        {!canLoadMappings ? (
          <p className="text-sm text-muted-foreground">Seleccione parser y facility para visualizar y gestionar mapeos.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4 rounded-md border border-gray-200 dark:border-gray-700 bg-muted/20 p-3 space-y-2">
                <div className="text-sm font-medium">Arbol de variables del parser</div>
                <p className="text-xs text-muted-foreground">
                  Expanda nodos para entender la estructura clinica. Seleccione una variable hoja para filtrar el mapeo.
                </p>
                <Input
                  value={variableTreeSearch}
                  onChange={(event) => setVariableTreeSearch(event.target.value)}
                  placeholder="Buscar en el arbol..."
                  disabled={isLoadingParserVariables}
                />
                <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-background p-2 max-h-[420px] overflow-y-auto space-y-1">
                  {isLoadingParserVariables ? (
                    <p className="text-xs text-muted-foreground">Cargando variables...</p>
                  ) : filteredVariableTree.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay variables disponibles para este parser.</p>
                  ) : (
                    renderTreeNodes(filteredVariableTree)
                  )}
                </div>
                <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-background p-2 text-xs space-y-1 shrink-0">
                  <div className="font-medium">Variable seleccionada</div>
                  {!selectedTreeNodeId ? (
                    <p className="text-muted-foreground">Sin filtro por variable.</p>
                  ) : selectedTreeNode?.type === "group" ? (
                    <p className="text-muted-foreground">
                      Rama seleccionada: <span className="font-medium text-foreground">{selectedTreeNode.label}</span>
                    </p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Key:</span> {selectedTreeNodeMeta?.variable_key || "-"}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Nombre:</span> {selectedTreeNodeMeta?.variable_name || "-"}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Unidad:</span> {selectedTreeNodeMeta?.unit || "-"}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8">
                {selectedTreeNodeId && (
                  <div className="mb-3 rounded-md border border-gray-300 dark:border-gray-700 bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between gap-2">
                    <div className="truncate">
                      Filtrando por {selectedTreeNode?.type === "group" ? "rama" : "variable"}: <span className="font-medium text-foreground">{selectedTreeNode?.label || selectedTreeNodeMeta?.variable_key || "-"}</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded hover:bg-background/60 p-0.5"
                      onClick={() => {
                        setSelectedTreeNodeId("");
                        setSelectedTreeNodeMeta(null);
                      }}
                      title="Limpiar filtro"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {fallbackMode !== "specific" && (
                  <div className="mb-3 rounded-md border border-gray-300 dark:border-gray-700 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    {fallbackMessage}
                  </div>
                )}

                <TablaDynamic
                  data={filteredMappings}
                  columns={columns}
                  actions={actions}
                  showIndex
                  loading={isLoadingMappings}
                  maxHeight="calc(100vh - 420px)"
                  tableClassName="table-fixed"
                  stickyPagination
                  perPageValue={pageSize}
                  onPerPageChange={handlePerPageChange}
                  perPageOptions={[5, 10, 15, 20, 25, 30, 50]}
                  pagination={{
                    page,
                    pageSize,
                    serverSide: false,
                    total: filteredMappings.length,
                  }}
                  onPaginationChange={handlePaginationChange}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMappingId(null);
          setModalVariableContext(null);
        }}
        title={modalMode === "edit" ? "Editar mapeo de variable" : "Nuevo mapeo de variable"}
        description={
          modalMode === "edit"
            ? "Actualice la regla para mapear la variable del parser a una variable canónica"
            : "Defina la regla para mapear la variable del parser a una variable canónica"
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {(modalMode === "createFromGeneric" || modalMode === "edit") ? (
            <>
              <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-muted/30 p-3 space-y-2 overflow-hidden">
                <p className="text-xs font-medium text-muted-foreground uppercase">Datos de la variable (referencia)</p>
                <div className="text-sm break-words">
                  <span className="font-medium">Canonical code:</span>{" "}
                  <span className="whitespace-pre-wrap break-all">{modalVariableContext?.canonical_code || "-"}</span>
                </div>
                <div className="text-sm break-words">
                  <span className="font-medium">Canonical name:</span>{" "}
                  <span className="whitespace-pre-wrap break-words">{modalVariableContext?.canonical_name || "-"}</span>
                </div>
                <div className="text-sm break-words">
                  <span className="font-medium">Concepto:</span>{" "}
                  <span className="whitespace-pre-wrap break-all">
                    {(modalVariableContext?.concept_code_scheme || "-") + " / " + (modalVariableContext?.concept_code_value || "-")}
                  </span>
                </div>
                <div className="text-sm break-words">
                  <span className="font-medium">Firma semántica:</span>{" "}
                  <span className="whitespace-pre-wrap break-all">{modalVariableContext?.semantic_signature || "-"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Facility Name</Label>
                <Input
                  value={form.facility_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, facility_name: event.target.value }))}
                  placeholder={modalVariableContext?.canonical_name || "Nombre para mostrar en la facility"}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <Label>Facility Code</Label>
                <Input
                  value={form.facility_code}
                  onChange={(event) => setForm((prev) => ({ ...prev, facility_code: event.target.value }))}
                  placeholder="Código interno de la facility"
                  disabled={isSaving}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Variable canónica</Label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
                  value={form.canonical_variable_definition_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      canonical_variable_definition_id: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                >
                  <option value="">Seleccione una variable...</option>
                  {definitions.map((definition) => (
                    <option key={definition.id} value={definition.id}>
                      {definition.canonical_code} — {definition.canonical_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Concept Code Value</Label>
                <Input
                  value={form.concept_code_value}
                  onChange={(event) => setForm((prev) => ({ ...prev, concept_code_value: event.target.value }))}
                  placeholder="Ej: 12345-6"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <Label>Concept Code Scheme</Label>
                <Input
                  value={form.concept_code_scheme}
                  onChange={(event) => setForm((prev) => ({ ...prev, concept_code_scheme: event.target.value }))}
                  placeholder="Ej: LN"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <Label>DICOM Path Pattern</Label>
                <Input
                  value={form.dicom_path_pattern}
                  onChange={(event) => setForm((prev) => ({ ...prev, dicom_path_pattern: event.target.value }))}
                  placeholder="Ej: ContentSequence.*.MeasuredValueSequence"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <Label>Descripción (opcional)</Label>
                <Input
                  value={form.facility_description}
                  onChange={(event) => setForm((prev) => ({ ...prev, facility_description: event.target.value }))}
                  placeholder="Descripción interna para la facility"
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="mapping-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                  disabled={isSaving}
                />
                <Label htmlFor="mapping-active">Activo</Label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMapping} disabled={isSaving}>
              {isSaving ? "Guardando..." : modalMode === "edit" ? "Guardar cambios" : "Guardar mapeo"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
