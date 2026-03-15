import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { TableAction, TableColumn } from "@/types/table";
import { parserFacilityRelService, type ParserOption } from "@/services/parser-facility-rel.service";
import {
  criteriaService,
  type ParserVariableTreeNode,
  type StructuredCriterion,
} from "@/services/criteria.service";

interface CriterionConditionForm {
  id: string;
  variable: string;
  variable_node_id: string;
  variable_label: string;
  operator: string;
  value: string;
  value_to: string;
}

interface CriterionBranchForm {
  id: string;
  logical_operator: "all" | "any";
  conditions: CriterionConditionForm[];
  output_text: string;
}

interface CriterionForm {
  criterion_name: string;
  logical_operator: "all" | "any";
  conditions: CriterionConditionForm[];
  output_text: string;
  else_if_branches: CriterionBranchForm[];
  else_output_text: string;
  priority: string;
  active: boolean;
}

const buildCondition = (): CriterionConditionForm => ({
  id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  variable: "",
  variable_node_id: "",
  variable_label: "",
  operator: ">",
  value: "",
  value_to: "",
});

const buildBranch = (): CriterionBranchForm => ({
  id: `branch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  logical_operator: "all",
  conditions: [buildCondition()],
  output_text: "",
});

const buildInitialForm = (): CriterionForm => ({
  criterion_name: "",
  logical_operator: "all",
  conditions: [buildCondition()],
  output_text: "",
  else_if_branches: [],
  else_output_text: "",
  priority: "100",
  active: true,
});

const operatorOptions = [">", ">=", "<", "<=", "==", "!=", "between", "contains"];

export const ConceptosCriteriosTab = () => {
  const [parsers, setParsers] = useState<ParserOption[]>([]);
  const [selectedParserId, setSelectedParserId] = useState<string>("");
  const [criteria, setCriteria] = useState<StructuredCriterion[]>([]);
  const [parserVariableTree, setParserVariableTree] = useState<ParserVariableTreeNode[]>([]);
  const [variableTreeSearch, setVariableTreeSearch] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string>("");
  const [selectedTreeNodeMeta, setSelectedTreeNodeMeta] = useState<ParserVariableTreeNode["metadata"] | null>(null);

  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  const [isLoadingParserVariables, setIsLoadingParserVariables] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingCriterionId, setEditingCriterionId] = useState<number | null>(null);
  const [form, setForm] = useState<CriterionForm>(buildInitialForm);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const selectedParser = useMemo(
    () => parsers.find((item) => String(item.id) === selectedParserId) || null,
    [parsers, selectedParserId]
  );

  const canWork = Boolean(selectedParserId);

  const loadContext = async () => {
    setIsLoadingContext(true);
    try {
      const parserData = await parserFacilityRelService.listParsers();
      setParsers(parserData);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudieron cargar los parser");
    } finally {
      setIsLoadingContext(false);
    }
  };

  const loadCriteria = async () => {
    if (!selectedParserId) {
      setCriteria([]);
      return;
    }

    setIsLoadingCriteria(true);
    try {
      const items = await criteriaService.list(Number(selectedParserId), true);
      setCriteria(items);
    } catch (error: any) {
      setCriteria([]);
      toast.error(error?.response?.data?.error || "No se pudieron cargar los criterios");
    } finally {
      setIsLoadingCriteria(false);
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
    loadCriteria();
    loadParserVariables();
  }, [selectedParserId]);

  const toRuleDefinition = (state: CriterionForm) => {
    const normalizeConditions = (conditions: CriterionConditionForm[]) =>
      conditions
        .map((condition) => {
          const parsed: Record<string, any> = {
            variable: condition.variable.trim(),
            variable_key: condition.variable.trim(),
            variable_node_id: condition.variable_node_id.trim() || undefined,
            variable_label: condition.variable_label.trim() || undefined,
            operator: condition.operator,
            value: condition.value,
          };
          if (condition.operator === "between") {
            parsed.value_to = condition.value_to;
          }
          return parsed;
        })
        .filter((condition) => condition.variable && condition.operator && condition.value !== "");

    const key = state.logical_operator || "all";
    const normalizedConditions = normalizeConditions(state.conditions);

    const ruleDefinition: Record<string, any> = {
      [key]: normalizedConditions,
    };

    let elseChain: any = undefined;
    const finalElseText = state.else_output_text.trim();
    if (finalElseText) {
      elseChain = finalElseText;
    }

    const normalizedBranches = state.else_if_branches
      .map((condition) => {
        const logicalKey = condition.logical_operator || "all";
        const normalizedBranchConditions = normalizeConditions(condition.conditions);
        return {
          logical_operator: logicalKey,
          conditions: normalizedBranchConditions,
          output_text: condition.output_text.trim(),
        };
      })
      .filter((branch) => branch.conditions.length > 0 && branch.output_text);

    for (let index = normalizedBranches.length - 1; index >= 0; index -= 1) {
      const branch = normalizedBranches[index];
      const branchIfRule = {
        [branch.logical_operator]: branch.conditions,
      };

      const branchRule: Record<string, any> = {
        if: branchIfRule,
        then: branch.output_text,
      };

      if (elseChain !== undefined && elseChain !== "") {
        branchRule.else = elseChain;
      }

      elseChain = branchRule;
    }

    if (elseChain !== undefined && elseChain !== "") {
      if (typeof elseChain === "string" && normalizedBranches.length === 0) {
        ruleDefinition.else_output_text = elseChain;
      } else {
        ruleDefinition.else = elseChain;
      }
    }

    return ruleDefinition;
  };

  const fromRuleDefinition = (ruleDefinition: any): Partial<CriterionForm> => {
    const parseLeaf = (condition: any): CriterionConditionForm | null => {
      if (!condition || typeof condition !== "object") {
        return null;
      }

      const parsedVariable = String(condition.variable || condition.variable_key || "");
      if (parsedVariable && condition.operator) {
        return {
          id: buildCondition().id,
          variable: parsedVariable,
          variable_node_id: String(condition.variable_node_id || ""),
          variable_label: String(condition.variable_label || parsedVariable),
          operator: String(condition.operator || ">"),
          value: condition.value !== undefined && condition.value !== null ? String(condition.value) : "",
          value_to: condition.value_to !== undefined && condition.value_to !== null ? String(condition.value_to) : "",
        };
      }

      return null;
    };

    const parseNode = (node: any): CriterionConditionForm | null => {
      const leaf = parseLeaf(node);
      if (leaf) {
        return leaf;
      }

      if (Array.isArray(node?.all) && node.all.length === 2) {
        const first = parseLeaf(node.all[0]);
        const second = parseLeaf(node.all[1]);
        // Compact common range shape: var >= x AND var <= y into "between".
        if (
          first &&
          second &&
          first.variable === second.variable &&
          [">", ">="].includes(first.operator) &&
          ["<", "<="].includes(second.operator)
        ) {
          return {
            id: buildCondition().id,
            variable: first.variable,
            variable_node_id: first.variable_node_id,
            variable_label: first.variable_label || first.variable,
            operator: "between",
            value: first.value,
            value_to: second.value,
          };
        }
      }

      if (Array.isArray(node?.all) && node.all.length === 1) {
        return parseLeaf(node.all[0]);
      }
      if (Array.isArray(node?.any) && node.any.length === 1) {
        return parseLeaf(node.any[0]);
      }

      return null;
    };

    const parseConditionSet = (node: any): { logical_operator: "all" | "any"; conditions: CriterionConditionForm[] } | null => {
      if (!node || typeof node !== "object") {
        return null;
      }

      if (parseLeaf(node)) {
        return {
          logical_operator: "all",
          conditions: [parseLeaf(node)!],
        };
      }

      const logicalOperator: "all" | "any" = Array.isArray(node?.any) ? "any" : "all";
      const source = logicalOperator === "any" ? node?.any : node?.all;
      if (!Array.isArray(source) || source.length === 0) {
        return null;
      }

      const conditions = source
        .map((condition: any) => parseNode(condition))
        .filter((condition): condition is CriterionConditionForm => Boolean(condition));

      if (conditions.length === 0) {
        return null;
      }

      return {
        logical_operator: logicalOperator,
        conditions,
      };
    };

    const parseElseChain = (
      node: any
    ): { branches: CriterionBranchForm[]; elseOutputText: string } => {
      const result: { branches: CriterionBranchForm[]; elseOutputText: string } = {
        branches: [],
        elseOutputText: "",
      };

      let cursor = node;
      while (cursor !== undefined && cursor !== null) {
        if (typeof cursor === "string") {
          result.elseOutputText = cursor.trim();
          break;
        }

        if (typeof cursor !== "object") {
          break;
        }

        const branchRuleNode = cursor?.if && typeof cursor.if === "object" ? cursor.if : cursor;
        const branchConditionSet = parseConditionSet(branchRuleNode);
        const branchOutput = String(cursor?.then || cursor?.output_text || cursor?.else_output_text || "").trim();

        if (branchConditionSet && branchOutput) {
          result.branches.push({
            id: buildBranch().id,
            logical_operator: branchConditionSet.logical_operator,
            conditions: branchConditionSet.conditions,
            output_text: branchOutput,
          });
        }

        if (cursor?.else !== undefined && cursor?.else !== null) {
          cursor = cursor.else;
          continue;
        }

        const fallbackElse = String(cursor?.else_output_text || "").trim();
        if (fallbackElse) {
          result.elseOutputText = fallbackElse;
        }
        break;
      }

      return result;
    };

    const rootNode =
      ruleDefinition?.if && typeof ruleDefinition.if === "object"
        ? ruleDefinition.if
        : ruleDefinition;

    const rootConditionSet = parseConditionSet(rootNode);
    if (!rootConditionSet) {
      return {};
    }

    let elseOutputText = String(ruleDefinition?.else_output_text || "").trim();
    let elseIfBranches: CriterionBranchForm[] = [];
    if (ruleDefinition?.else !== undefined && ruleDefinition?.else !== null) {
      const parsedChain = parseElseChain(ruleDefinition.else);
      elseIfBranches = parsedChain.branches;
      if (parsedChain.elseOutputText) {
        elseOutputText = parsedChain.elseOutputText;
      }
    }

    return {
      logical_operator: rootConditionSet.logical_operator,
      conditions: rootConditionSet.conditions,
      else_if_branches: elseIfBranches,
      else_output_text: elseOutputText,
    };
  };

  const handleOpenCreate = () => {
    if (!canWork) {
      toast.error("Seleccione un parser");
      return;
    }
    setModalMode("create");
    setEditingCriterionId(null);
    setForm(buildInitialForm());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: StructuredCriterion) => {
    setModalMode("edit");
    setEditingCriterionId(row.id);
    const baseForm = buildInitialForm();
    setForm({
      ...baseForm,
      criterion_name: row.criterion_name || "",
      output_text: row.output_text || "",
      else_output_text: String(row.rule_definition?.else_output_text || "").trim(),
      priority: String(row.priority ?? 100),
      active: Boolean(row.active),
      ...fromRuleDefinition(row.rule_definition),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (row: StructuredCriterion) => {
    try {
      await criteriaService.delete(row.id);
      toast.success("Criterio eliminado correctamente");
      loadCriteria();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudo eliminar el criterio");
    }
  };

  const handleSave = async () => {
    if (!selectedParserId) {
      toast.error("Seleccione un parser");
      return;
    }
    if (!form.criterion_name.trim()) {
      toast.error("Ingrese un nombre para el criterio");
      return;
    }
    if (!Array.isArray(form.conditions) || form.conditions.length === 0) {
      toast.error("Agregue al menos una condición");
      return;
    }

    for (let branchIndex = 0; branchIndex < form.else_if_branches.length; branchIndex += 1) {
      const branch = form.else_if_branches[branchIndex];
      if (!Array.isArray(branch.conditions) || branch.conditions.length === 0) {
        toast.error(`Else if ${branchIndex + 1}: agregue al menos una condición`);
        return;
      }

      for (let conditionIndex = 0; conditionIndex < branch.conditions.length; conditionIndex += 1) {
        const condition = branch.conditions[conditionIndex];
        if (!condition.variable.trim()) {
          toast.error(`Else if ${branchIndex + 1}, condición ${conditionIndex + 1}: ingrese la variable`);
          return;
        }
        if (condition.value === "") {
          toast.error(`Else if ${branchIndex + 1}, condición ${conditionIndex + 1}: ingrese el valor de comparación`);
          return;
        }
        if (condition.operator === "between" && condition.value_to === "") {
          toast.error(`Else if ${branchIndex + 1}, condición ${conditionIndex + 1}: para between complete valor hasta`);
          return;
        }
      }

      if (!branch.output_text.trim()) {
        toast.error(`Else if ${branchIndex + 1}: ingrese el texto de salida`);
        return;
      }
    }

    for (let index = 0; index < form.conditions.length; index += 1) {
      const condition = form.conditions[index];
      if (!condition.variable.trim()) {
        toast.error(`Condición ${index + 1}: ingrese la variable`);
        return;
      }
      if (condition.value === "") {
        toast.error(`Condición ${index + 1}: ingrese el valor de comparación`);
        return;
      }
      if (condition.operator === "between" && condition.value_to === "") {
        toast.error(`Condición ${index + 1}: para operator between complete valor hasta`);
        return;
      }
    }

    if (!form.output_text.trim()) {
      toast.error("Ingrese el texto final del criterio");
      return;
    }

    const ruleDefinition = toRuleDefinition(form);

    setIsSaving(true);
    try {
      if (modalMode === "edit" && editingCriterionId) {
        await criteriaService.update(editingCriterionId, {
          criterion_name: form.criterion_name.trim(),
          rule_definition: ruleDefinition,
          output_text: form.output_text.trim(),
          priority: Number(form.priority || "100"),
          active: form.active,
        });
        toast.success("Criterio actualizado correctamente");
      } else {
        await criteriaService.create({
          parser_manifest_id: Number(selectedParserId),
          criterion_name: form.criterion_name.trim(),
          rule_definition: ruleDefinition,
          output_text: form.output_text.trim(),
          priority: Number(form.priority || "100"),
          active: form.active,
        });
        toast.success("Criterio creado correctamente");
      }

      setIsModalOpen(false);
      setEditingCriterionId(null);
      loadCriteria();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "No se pudo guardar el criterio");
    } finally {
      setIsSaving(false);
    }
  };

  const columns: TableColumn<StructuredCriterion>[] = useMemo(
    () => [
      {
        key: "criterion_name",
        label: "CRITERIO",
        sortable: true,
        filterable: true,
      },
      {
        key: "rule_definition",
        label: "REGLA",
        sortable: false,
        filterable: false,
        render: (value: any) => {
          const condition = Array.isArray(value?.all) ? value.all[0] : null;
          if (!condition) {
            return "-";
          }
          const displayVariable = String(condition.variable_label || condition.variable || "-");
          if (String(condition.operator || "") === "between") {
            return `${displayVariable} between ${condition.value} y ${condition.value_to}`;
          }
          return `${displayVariable} ${condition.operator} ${condition.value}`;
        },
      },
      {
        key: "output_text",
        label: "TEXTO FINAL",
        sortable: true,
        filterable: true,
        render: (value: string) => (
          <span className="inline-block max-w-[500px] truncate align-bottom" title={value || ""}>
            {value || "-"}
          </span>
        ),
      },
      {
        key: "priority",
        label: "PRIORIDAD",
        sortable: true,
        filterable: true,
      },
      {
        key: "active",
        label: "ACTIVO",
        sortable: true,
        filterable: true,
        render: (value: boolean) => (value ? "Si" : "No"),
      },
    ],
    []
  );

  const actions: TableAction<StructuredCriterion>[] = [
    {
      label: "Editar",
      icon: <Pencil className="h-4 w-4 text-blue-600" />,
      onClick: handleOpenEdit,
    },
    {
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4 text-red-600" />,
      onClick: handleDelete,
    },
  ];

  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const addCondition = () => {
    setForm((prev) => ({ ...prev, conditions: [...prev.conditions, buildCondition()] }));
  };

  const addElseIfBranch = () => {
    setForm((prev) => ({ ...prev, else_if_branches: [...prev.else_if_branches, buildBranch()] }));
  };

  const removeElseIfBranch = (branchId: string) => {
    setForm((prev) => ({
      ...prev,
      else_if_branches: prev.else_if_branches.filter((branch) => branch.id !== branchId),
    }));
  };

  const removeCondition = (conditionId: string) => {
    setForm((prev) => {
      const nextConditions = prev.conditions.filter((condition) => condition.id !== conditionId);
      return {
        ...prev,
        conditions: nextConditions.length > 0 ? nextConditions : [buildCondition()],
      };
    });
  };

  const updateCondition = (conditionId: string, key: keyof Omit<CriterionConditionForm, "id">, value: string) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) =>
        condition.id === conditionId
          ? {
              ...condition,
              [key]: value,
              ...(key === "operator" && value !== "between" ? { value_to: "" } : {}),
            }
          : condition
      ),
    }));
  };

  const addBranchCondition = (branchId: string) => {
    setForm((prev) => ({
      ...prev,
      else_if_branches: prev.else_if_branches.map((branch) =>
        branch.id === branchId ? { ...branch, conditions: [...branch.conditions, buildCondition()] } : branch
      ),
    }));
  };

  const removeBranchCondition = (branchId: string, conditionId: string) => {
    setForm((prev) => ({
      ...prev,
      else_if_branches: prev.else_if_branches.map((branch) => {
        if (branch.id !== branchId) {
          return branch;
        }
        const nextConditions = branch.conditions.filter((condition) => condition.id !== conditionId);
        return {
          ...branch,
          conditions: nextConditions.length > 0 ? nextConditions : [buildCondition()],
        };
      }),
    }));
  };

  const updateBranchCondition = (
    branchId: string,
    conditionId: string,
    key: keyof Omit<CriterionConditionForm, "id">,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      else_if_branches: prev.else_if_branches.map((branch) => {
        if (branch.id !== branchId) {
          return branch;
        }
        return {
          ...branch,
          conditions: branch.conditions.map((condition) =>
            condition.id === conditionId
              ? {
                  ...condition,
                  [key]: value,
                  ...(key === "operator" && value !== "between" ? { value_to: "" } : {}),
                }
              : condition
          ),
        };
      }),
    }));
  };

  const updateBranch = (branchId: string, key: keyof Omit<CriterionBranchForm, "id" | "conditions">, value: string) => {
    setForm((prev) => ({
      ...prev,
      else_if_branches: prev.else_if_branches.map((branch) =>
        branch.id === branchId
          ? {
              ...branch,
              [key]: key === "logical_operator" ? (value === "any" ? "any" : "all") : value,
            }
          : branch
      ),
    }));
  };

  const toggleNodeExpanded = (nodeId: string) => {
    setExpandedNodeIds((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const applySelectedVariable = (
    conditionId: string,
    payload: { variableKey: string; variableLabel?: string; variableNodeId?: string }
  ) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) =>
        condition.id === conditionId
          ? {
              ...condition,
              variable: String(payload.variableKey || "").trim(),
              variable_label: String(payload.variableLabel || payload.variableKey || "").trim(),
              variable_node_id: String(payload.variableNodeId || "").trim(),
            }
          : condition
      ),
    }));
  };

  const applySelectedVariableToBranch = (
    branchId: string,
    conditionId: string,
    payload: { variableKey: string; variableLabel?: string; variableNodeId?: string }
  ) => {
    setForm((prev) => ({
      ...prev,
      else_if_branches: prev.else_if_branches.map((branch) => {
        if (branch.id !== branchId) {
          return branch;
        }
        return {
          ...branch,
          conditions: branch.conditions.map((condition) =>
            condition.id === conditionId
              ? {
                  ...condition,
                  variable: String(payload.variableKey || "").trim(),
                  variable_label: String(payload.variableLabel || payload.variableKey || "").trim(),
                  variable_node_id: String(payload.variableNodeId || "").trim(),
                }
              : condition
          ),
        };
      }),
    }));
  };

  const applyDroppedVariable = (conditionId: string, event: React.DragEvent) => {
    event.preventDefault();

    const payloadRaw = event.dataTransfer.getData("application/x-variable-payload");
    if (payloadRaw) {
      try {
        const payload = JSON.parse(payloadRaw);
        applySelectedVariable(conditionId, {
          variableKey: String(payload.variable_key || payload.variableKey || ""),
          variableLabel: String(payload.variable_name || payload.variableLabel || payload.label || ""),
          variableNodeId: String(payload.node_id || payload.variableNodeId || ""),
        });
        return;
      } catch {
        // fallback to plain text
      }
    }

    const variableKey = event.dataTransfer.getData("text/plain");
    if (variableKey) {
      applySelectedVariable(conditionId, {
        variableKey,
        variableLabel: variableKey,
      });
    }
  };

  const clearConditionVariable = (conditionId: string) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) =>
        condition.id === conditionId
          ? {
              ...condition,
              variable: "",
              variable_label: "",
              variable_node_id: "",
            }
          : condition
      ),
    }));
  };

  const applyDroppedVariableToBranch = (branchId: string, conditionId: string, event: React.DragEvent) => {
    event.preventDefault();

    const payloadRaw = event.dataTransfer.getData("application/x-variable-payload");
    if (payloadRaw) {
      try {
        const payload = JSON.parse(payloadRaw);
        applySelectedVariableToBranch(branchId, conditionId, {
          variableKey: String(payload.variable_key || payload.variableKey || ""),
          variableLabel: String(payload.variable_name || payload.variableLabel || payload.label || ""),
          variableNodeId: String(payload.node_id || payload.variableNodeId || ""),
        });
        return;
      } catch {
        // fallback to plain text
      }
    }

    const variableKey = event.dataTransfer.getData("text/plain");
    if (variableKey) {
      applySelectedVariableToBranch(branchId, conditionId, {
        variableKey,
        variableLabel: variableKey,
      });
    }
  };

  const clearBranchConditionVariable = (branchId: string, conditionId: string) => {
    setForm((prev) => ({
      ...prev,
      else_if_branches: prev.else_if_branches.map((branch) => {
        if (branch.id !== branchId) {
          return branch;
        }
        return {
          ...branch,
          conditions: branch.conditions.map((condition) =>
            condition.id === conditionId
              ? {
                  ...condition,
                  variable: "",
                  variable_label: "",
                  variable_node_id: "",
                }
              : condition
          ),
        };
      }),
    }));
  };

  const filterTreeNodes = (nodes: ParserVariableTreeNode[], term: string): ParserVariableTreeNode[] => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return nodes;
    }

    const walk = (list: ParserVariableTreeNode[]): ParserVariableTreeNode[] => {
      const result: ParserVariableTreeNode[] = [];
      for (const node of list) {
        const selfMatches = String(node.label || "").toLowerCase().includes(normalized);
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

  const renderTreeNodes = (nodes: ParserVariableTreeNode[], depth = 0) => {
    const leftPadding = 8 + depth * 14;

    return nodes.flatMap((node) => {
      const isGroup = node.type === "group";
      const isExpanded = Boolean(expandedNodeIds[node.id]);
      const row = (
        <div key={node.id} className="space-y-1">
          <button
            type="button"
            className={
              isGroup
                ? "w-full rounded-md border border-gray-200 dark:border-gray-700 bg-background/60 px-2 py-1.5 text-left text-xs hover:border-brand-purple/60"
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
                return;
              }

              setSelectedTreeNodeId(node.id);
              setSelectedTreeNodeMeta(node.metadata || null);

              const lastCondition = form.conditions[form.conditions.length - 1];
              if (lastCondition && node.metadata?.variable_key) {
                applySelectedVariable(lastCondition.id, {
                  variableKey: node.metadata.variable_key,
                  variableLabel: node.metadata.variable_name || node.label,
                  variableNodeId: node.id,
                });
              }
            }}
            draggable={!isGroup}
            onDragStart={(event) => {
              if (isGroup || !node.metadata?.variable_key) {
                return;
              }
              event.dataTransfer.setData("text/plain", node.metadata.variable_key);
              event.dataTransfer.setData(
                "application/x-variable-payload",
                JSON.stringify({
                  node_id: node.id,
                  variable_key: node.metadata.variable_key,
                  variable_name: node.metadata.variable_name || node.label,
                })
              );
            }}
          >
            <div className="flex items-center gap-1">
              {isGroup ? (
                isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
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

      return [row];
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1 md:col-span-2">
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

          <div className="flex items-end justify-end gap-2">
            <Button type="button" variant="outline" onClick={loadCriteria} disabled={!canWork || isLoadingCriteria}>
              {isLoadingCriteria ? "Cargando..." : "Cargar criterios"}
            </Button>
            <Button type="button" onClick={handleOpenCreate} disabled={!canWork}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo criterio
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900/70 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        {!canWork ? (
          <p className="text-sm text-muted-foreground">Seleccione parser para crear y gestionar criterios.</p>
        ) : (
          <>
            <div className="mb-3 text-xs text-muted-foreground">
              Las reglas se guardan como JSON y se evalúan contra variables extraídas del SR. Ejemplo: "VI_diametro &gt; 42".
            </div>
            <TablaDynamic
              data={criteria}
              columns={columns}
              actions={actions}
              showIndex
              loading={isLoadingCriteria}
              pagination={{
                page,
                pageSize,
                serverSide: false,
                total: criteria.length,
              }}
              onPaginationChange={handlePaginationChange}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCriterionId(null);
        }}
        size="full"
        className="w-[96vw] sm:max-w-[1200px] min-h-[620px] h-[82vh] overflow-hidden"
        title={modalMode === "edit" ? "Editar criterio" : "Nuevo criterio"}
        description={
          selectedParser
            ? `Parser: ${selectedParser.parser_name} (${selectedParser.parser_version})`
            : "Defina la regla clínica y el texto final"
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(82vh-170px)] min-h-[470px] overflow-y-auto overflow-x-hidden pr-1">
          <div className="lg:col-span-4 space-y-2">
            <div className="text-sm font-medium">Variables del parser (arbol)</div>
            <p className="text-xs text-muted-foreground">Expanda nodos para navegar el contexto clinico y seleccione una variable hoja.</p>
            <Input
              value={variableTreeSearch}
              onChange={(event) => setVariableTreeSearch(event.target.value)}
              placeholder="Buscar en el arbol..."
              disabled={isSaving || isLoadingParserVariables}
            />
            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-muted/20 p-2 max-h-[56vh] overflow-y-auto space-y-2">
              {isLoadingParserVariables ? (
                <p className="text-xs text-muted-foreground">Cargando variables...</p>
              ) : filteredVariableTree.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay variables mapeadas para este parser.</p>
              ) : (
                renderTreeNodes(filteredVariableTree)
              )}
            </div>
            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-background p-2 text-xs">
              <div className="font-medium mb-1">Nodo seleccionado</div>
              {!selectedTreeNodeMeta?.variable_key ? (
                <p className="text-muted-foreground">Seleccione una variable hoja para ver su detalle.</p>
              ) : (
                <div className="space-y-1 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Key:</span> {selectedTreeNodeMeta.variable_key}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Nombre:</span> {selectedTreeNodeMeta.variable_name}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Unidad:</span> {selectedTreeNodeMeta.unit || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Source:</span> {selectedTreeNodeMeta.source_type || "-"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-1">
              <Label>Nombre del criterio</Label>
              <Input
                value={form.criterion_name}
                onChange={(event) => setForm((prev) => ({ ...prev, criterion_name: event.target.value }))}
                placeholder="Ej: Dilatacion auricular izquierda"
                disabled={isSaving}
              />
            </div>

            <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <Label>Combinador lógico</Label>
                  <select
                    className="rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
                    value={form.logical_operator}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        logical_operator: event.target.value === "any" ? "any" : "all",
                      }))
                    }
                    disabled={isSaving}
                  >
                    <option value="all">AND (todas deben cumplirse)</option>
                    <option value="any">OR (al menos una debe cumplirse)</option>
                  </select>
                </div>

                <Button type="button" variant="outline" onClick={addCondition} disabled={isSaving}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar condición
                </Button>
              </div>

              <div className="space-y-2">
                {form.conditions.map((condition, index) => (
                  <div key={condition.id} className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Condición {index + 1}
                      {index > 0 ? ` (${form.logical_operator === "all" ? "AND" : "OR"})` : ""}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-4 space-y-1">
                        <Label>Variable</Label>
                        <div
                          className={
                            condition.variable
                              ? "flex h-10 w-full items-stretch overflow-hidden rounded-full border border-brand-purple/60 bg-brand-purple"
                              : "flex h-10 w-full items-stretch overflow-hidden rounded-full border border-gray-300 dark:border-gray-700 bg-background"
                          }
                        >
                          <div
                            className={
                              condition.variable
                                ? "flex-1 cursor-copy truncate px-3 py-2 text-sm font-medium text-white"
                                : "flex-1 cursor-copy truncate px-3 py-2 text-sm text-muted-foreground"
                            }
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => applyDroppedVariable(condition.id, event)}
                            title={condition.variable_label || condition.variable || "Arrastre o seleccione una variable"}
                          >
                            {condition.variable_label || condition.variable || "Arrastre o seleccione una variable"}
                          </div>
                          <button
                            type="button"
                            className="h-full w-10 shrink-0 border-l border-white/20 bg-red-600 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => clearConditionVariable(condition.id)}
                            disabled={isSaving || !condition.variable}
                            title="Limpiar variable"
                            aria-label="Limpiar variable"
                          >
                            <X className="mx-auto h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Este campo no permite escritura manual. Solo se completa con drag & drop o clic en una variable.
                        </p>
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <Label>Operador</Label>
                        <select
                          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
                          value={condition.operator}
                          onChange={(event) => updateCondition(condition.id, "operator", event.target.value)}
                          disabled={isSaving}
                        >
                          {operatorOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={condition.operator === "between" ? "md:col-span-2" : "md:col-span-4"}>
                        <div className="space-y-1">
                          <Label>Valor</Label>
                          <Input
                            value={condition.value}
                            onChange={(event) => updateCondition(condition.id, "value", event.target.value)}
                            placeholder="Ej: 42"
                            disabled={isSaving}
                          />
                        </div>
                      </div>

                      {condition.operator === "between" && (
                        <div className="md:col-span-2 space-y-1">
                          <Label>Hasta</Label>
                          <Input
                            value={condition.value_to}
                            onChange={(event) => updateCondition(condition.id, "value_to", event.target.value)}
                            placeholder="Ej: 48"
                            disabled={isSaving}
                          />
                        </div>
                      )}

                      <div className="md:col-span-1 flex items-end justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeCondition(condition.id)}
                          disabled={isSaving || form.conditions.length === 1}
                          title="Eliminar condición"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Texto final si cumple</Label>
              <Input
                value={form.output_text}
                onChange={(event) => setForm((prev) => ({ ...prev, output_text: event.target.value }))}
                placeholder="Ej: Hallazgo patologico: dilatacion de auricula izquierda"
                disabled={isSaving}
              />
            </div>

            <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <Label>Ramas else if (anidadas)</Label>
                  <p className="text-xs text-muted-foreground">
                    Cada bloque agrega más lógica si no se cumple la condición principal. Se evalúan en orden.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={addElseIfBranch} disabled={isSaving}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar else if
                </Button>
              </div>

              <div className="space-y-2">
                {form.else_if_branches.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin ramas else if.</p>
                ) : (
                  form.else_if_branches.map((branch, branchIndex) => (
                    <div key={branch.id} className="rounded-md border border-gray-200 dark:border-gray-700 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">Else if {branchIndex + 1}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeElseIfBranch(branch.id)}
                          disabled={isSaving}
                          title="Eliminar rama else if"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <Label>Combinador lógico (else if)</Label>
                          <select
                            className="rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
                            value={branch.logical_operator}
                            onChange={(event) => updateBranch(branch.id, "logical_operator", event.target.value)}
                            disabled={isSaving}
                          >
                            <option value="all">AND (todas deben cumplirse)</option>
                            <option value="any">OR (al menos una debe cumplirse)</option>
                          </select>
                        </div>

                        <Button type="button" variant="outline" onClick={() => addBranchCondition(branch.id)} disabled={isSaving}>
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar condición
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {branch.conditions.map((condition, conditionIndex) => (
                          <div key={condition.id} className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
                            <div className="text-xs text-muted-foreground mb-2">
                              Condición {conditionIndex + 1}
                              {conditionIndex > 0 ? ` (${branch.logical_operator === "all" ? "AND" : "OR"})` : ""}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                              <div className="md:col-span-4 space-y-1">
                                <Label>Variable</Label>
                                <div
                                  className={
                                    condition.variable
                                      ? "flex h-10 w-full items-stretch overflow-hidden rounded-full border border-brand-purple/60 bg-brand-purple"
                                      : "flex h-10 w-full items-stretch overflow-hidden rounded-full border border-gray-300 dark:border-gray-700 bg-background"
                                  }
                                >
                                  <div
                                    className={
                                      condition.variable
                                        ? "flex-1 cursor-copy truncate px-3 py-2 text-sm font-medium text-white"
                                        : "flex-1 cursor-copy truncate px-3 py-2 text-sm text-muted-foreground"
                                    }
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => applyDroppedVariableToBranch(branch.id, condition.id, event)}
                                    title={condition.variable_label || condition.variable || "Arrastre o seleccione una variable"}
                                  >
                                    {condition.variable_label || condition.variable || "Arrastre o seleccione una variable"}
                                  </div>
                                  <button
                                    type="button"
                                    className="h-full w-10 shrink-0 border-l border-white/20 bg-red-600 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => clearBranchConditionVariable(branch.id, condition.id)}
                                    disabled={isSaving || !condition.variable}
                                    title="Limpiar variable"
                                    aria-label="Limpiar variable"
                                  >
                                    <X className="mx-auto h-4 w-4" />
                                  </button>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  Este campo no permite escritura manual. Solo se completa con drag & drop o clic en una variable.
                                </p>
                              </div>

                              <div className="md:col-span-3 space-y-1">
                                <Label>Operador</Label>
                                <select
                                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm"
                                  value={condition.operator}
                                  onChange={(event) =>
                                    updateBranchCondition(branch.id, condition.id, "operator", event.target.value)
                                  }
                                  disabled={isSaving}
                                >
                                  {operatorOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className={condition.operator === "between" ? "md:col-span-2" : "md:col-span-4"}>
                                <div className="space-y-1">
                                  <Label>Valor</Label>
                                  <Input
                                    value={condition.value}
                                    onChange={(event) =>
                                      updateBranchCondition(branch.id, condition.id, "value", event.target.value)
                                    }
                                    placeholder="Ej: 42"
                                    disabled={isSaving}
                                  />
                                </div>
                              </div>

                              {condition.operator === "between" && (
                                <div className="md:col-span-2 space-y-1">
                                  <Label>Hasta</Label>
                                  <Input
                                    value={condition.value_to}
                                    onChange={(event) =>
                                      updateBranchCondition(branch.id, condition.id, "value_to", event.target.value)
                                    }
                                    placeholder="Ej: 48"
                                    disabled={isSaving}
                                  />
                                </div>
                              )}

                              <div className="md:col-span-1 flex items-end justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => removeBranchCondition(branch.id, condition.id)}
                                  disabled={isSaving || branch.conditions.length === 1}
                                  title="Eliminar condición"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <Label>Texto final de este else if</Label>
                        <Input
                          value={branch.output_text}
                          onChange={(event) => updateBranch(branch.id, "output_text", event.target.value)}
                          placeholder="Texto si esta rama else if se cumple"
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Texto alternativo si NO cumple (else)</Label>
              <Input
                value={form.else_output_text}
                onChange={(event) => setForm((prev) => ({ ...prev, else_output_text: event.target.value }))}
                placeholder="Opcional: texto para rama else"
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Prioridad</Label>
                <Input
                  value={form.priority}
                  onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                  placeholder="100"
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-end gap-2">
                <input
                  id="criterion-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                  disabled={isSaving}
                />
                <Label htmlFor="criterion-active">Activo</Label>
              </div>
            </div>

            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Vista previa de regla JSON</p>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(toRuleDefinition(form), null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Guardando..." : modalMode === "edit" ? "Guardar cambios" : "Guardar criterio"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
