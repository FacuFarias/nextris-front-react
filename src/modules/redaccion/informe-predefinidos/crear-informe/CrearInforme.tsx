import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/layouts/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Save, ChevronDown, ChevronUp, ArrowLeft, Loader2, Bold, Italic, Underline as UnderlineIcon, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, PanelRightClose, PanelRightOpen, Lock } from "lucide-react";
import { useCreateTemplate, useUpdateTemplate, useTemplate } from "../hooks/use-templates";
import { usePlaceholderNavigation } from "../hooks/use-placeholder-navigation";
import { toast } from "sonner";
import { useTiposEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/tipos-estudio";
import { useLocationsInstitutional } from "@/hooks/use-locations";
import { Autocomplete, type AutocompleteOption } from "@/components/autocomplete";
import { parserFacilityRelService } from "@/services/parser-facility-rel.service";
import { criteriaService, type ParserCriterionVariable, type StructuredCriterion } from "@/services/criteria.service";
import type { ReportType } from "../types/informe-pred.types";
import { useAuth } from "@/context/AuthContext";

const stripVariablePlaceholdersFromHtml = (html: string): string => {
    if (!html) return html;

    // Solo elimina chips de variables/criterios (elementos interactivos de tipo inteligente),
    // pero conserva texto plano como [[ ]] escrito manualmente.
    return html
        .replace(/<span[^>]*data-variable-chip=["']true["'][^>]*>.*?<\/span>/gis, '')
        .replace(/<span[^>]*data-criterion-chip=["']true["'][^>]*>.*?<\/span>/gis, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
};

interface StudyTypeVariableItem {
    key: string;
    displayName: string;
    variableName: string;
    canonicalCode?: string | null;
    unit?: string | null;
}

export const CrearInforme = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Obtener el ID de la URL
    const isEditMode = !!id; // Determinar si estamos en modo edición

    const { authData } = useAuth();
    const isSysadmin = ['sysadmin', 'admin', 'administrador'].includes(
        (authData?.user?.role_name || '').toLowerCase()
    );

    // Cargar datos de la plantilla si estamos en modo edición
    const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(id || '');

    // Form states
    const [title, setTitle] = useState("");
    const [findings, setFindings] = useState("");
    const [impression, setImpression] = useState("");
    const [conclusion, setConclusion] = useState("");
    const [technique, setTechnique] = useState("");
    const [isDefaultReport, setIsDefaultReport] = useState(false);
    const [reportType, setReportType] = useState<ReportType>('simple');
    const [studyTypeFilter, setStudyTypeFilter] = useState<string>("");
    const [isStudySidebarOpen, setIsStudySidebarOpen] = useState(true);
    const [structuredVariables, setStructuredVariables] = useState("");
    const [criteria, setCriteria] = useState("");
    const [rightMetaTab, setRightMetaTab] = useState<'info' | 'variables' | 'criterios'>('info');
    const [studyTypeVariables, setStudyTypeVariables] = useState<StudyTypeVariableItem[]>([]);
    const [relatedCriteria, setRelatedCriteria] = useState<StructuredCriterion[]>([]);
    const [isLoadingStudyTypeVariables, setIsLoadingStudyTypeVariables] = useState(false);
    const [isLoadingRelatedCriteria, setIsLoadingRelatedCriteria] = useState(false);
    const [studyTypeVariablesError, setStudyTypeVariablesError] = useState<string>("");
    const [relatedCriteriaError, setRelatedCriteriaError] = useState<string>("");
    const [variablesSearchTerm, setVariablesSearchTerm] = useState("");
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [locationsSearchTerm, setLocationsSearchTerm] = useState("");
    const [dragOverEditorField, setDragOverEditorField] = useState<(typeof editorFieldOrder)[number] | null>(null);
    const draggedChipRef = useRef<{ type: 'variable' | 'criterion'; value: string } | null>(null);

    // Hook para navegación de placeholders con F3
    const editorFieldOrder = ['technique', 'findings', 'impression', 'conclusion'] as const;
    const { editorsRef } = usePlaceholderNavigation(editorFieldOrder as unknown as string[]);
    const [activeEditorField, setActiveEditorField] = useState<(typeof editorFieldOrder)[number] | null>(null);
    const currentFieldRef = useRef<(typeof editorFieldOrder)[number] | null>(null);
    const { tiposEstudio } = useTiposEstudio();
    const { data: locationsData, isLoading: isLoadingLocations } = useLocationsInstitutional();

    const selectedFacilityIds = useMemo<string[]>(() => {
        if (!Array.isArray(locationsData?.data) || selectedLocationIds.length === 0) {
            return [] as string[];
        }

        const selectedLocationsSet = new Set(selectedLocationIds);
        const facilityIds: string[] = locationsData.data
            .filter((location: any) => selectedLocationsSet.has(String(location.guid)))
            .map((location: any) => String(location.facility_id || '').trim())
            .filter(Boolean);

        return Array.from(new Set(facilityIds));
    }, [locationsData, selectedLocationIds]);

    const handleEditorReady = useCallback((editor: any, fieldName: (typeof editorFieldOrder)[number]) => {
        editorsRef.current[fieldName] = editor;

        if (!currentFieldRef.current) {
            currentFieldRef.current = fieldName;
            setActiveEditorField(fieldName);
        }

        editor.on('focus', () => {
            currentFieldRef.current = fieldName;
            setActiveEditorField(fieldName);
        });
    }, [editorsRef]);

    const activeEditor: any = activeEditorField ? editorsRef.current[activeEditorField] : null;

    const handleVariableDragStart = (variableName: string) => {
        const normalized = (variableName || '').trim();
        draggedChipRef.current = normalized ? { type: 'variable', value: normalized } : null;
    };

    const handleCriterionDragStart = (criterionName: string) => {
        const normalized = (criterionName || '').trim();
        draggedChipRef.current = normalized ? { type: 'criterion', value: normalized } : null;
    };

    const handleVariableDragEnd = () => {
        setDragOverEditorField(null);
        draggedChipRef.current = null;
    };

    const handleEditorDragOver = (e: React.DragEvent, fieldName: (typeof editorFieldOrder)[number]) => {
        e.preventDefault();
        setDragOverEditorField(fieldName);
    };

    const handleEditorDragLeave = () => {
        setDragOverEditorField(null);
    };

    const handleVariableDropInEditor = (e: React.DragEvent, fieldName: (typeof editorFieldOrder)[number]) => {
        e.preventDefault();
        const editor = editorsRef.current[fieldName] as any;
        const draggedChip = draggedChipRef.current;
        const draggedCriterionName = e.dataTransfer.getData('application/x-criterion-name').trim();
        const draggedVariableName = e.dataTransfer.getData('application/x-variable-name').trim();
        const fallbackText = e.dataTransfer.getData('text/plain').trim();

        const chipType = draggedChip?.type || (draggedCriterionName ? 'criterion' : 'variable');
        const chipValue = (
            draggedChip?.value ||
            draggedCriterionName ||
            draggedVariableName ||
            fallbackText ||
            ''
        ).trim();

        if (editor && chipValue) {
            editor
                .chain()
                .focus()
                .insertContent([
                    {
                        type: chipType === 'criterion' ? 'criterionChip' : 'variableChip',
                        attrs: {
                            ...(chipType === 'criterion'
                                ? { criterionName: chipValue }
                                : { variableName: chipValue }),
                        },
                    },
                    {
                        type: 'text',
                        text: ' ',
                    },
                ])
                .run();
        }

        setDragOverEditorField(null);
            draggedChipRef.current = null;
    };

    // Efecto para cargar los datos cuando estamos en modo edición
    useEffect(() => {
        if (isEditMode && templateData?.data) {
            const template = templateData.data;
            setTitle(template.title || "");
            setFindings(template.findings || "");
            setImpression(template.impression || "");
            setConclusion(template.conclusion || "");
            setTechnique(template.technique || "");
            setStudyTypeFilter(template.study_type_id || "");
            setReportType((template.report_type as ReportType) || 'simple');
            setStructuredVariables((template as any).structured_variables || "");
            setCriteria((template as any).criteria || "");
            setSelectedLocationIds(Array.isArray((template as any).location_ids) ? (template as any).location_ids : []);
        }
    }, [templateData, isEditMode]);

    // Estado para controlar qué secciones están abiertas/cerradas
    const [openSections, setOpenSections] = useState({
        tecnica: true,
        hallazgos: true,
        impresiones: true,
        conclusiones: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const createTemplateMutation = useCreateTemplate();
    const updateTemplateMutation = useUpdateTemplate();

    // Cargar variables y criterios relacionados por study type + facility/location
    useEffect(() => {
        const loadRelatedData = async () => {
            if (!studyTypeFilter) {
                setStudyTypeVariables([]);
                setRelatedCriteria([]);
                setStudyTypeVariablesError("");
                setRelatedCriteriaError("");
                return;
            }

            setIsLoadingStudyTypeVariables(true);
            setIsLoadingRelatedCriteria(true);
            setStudyTypeVariablesError("");
            setRelatedCriteriaError("");

            try {
                const [studytypeRelations, parserFacilityRelations] = await Promise.all([
                    parserFacilityRelService.listStudytypeRelations(),
                    parserFacilityRelService.listRelations(),
                ]);

                const parserIdsForStudyType = new Set(
                    studytypeRelations
                        .filter((rel) => String(rel.studytype_guid) === String(studyTypeFilter))
                        .map((rel) => rel.parser_manifest_id)
                );

                const parserIdsForFacilities = new Set(
                    parserFacilityRelations
                        .filter((rel) => selectedFacilityIds.includes(String(rel.facility_guid)))
                        .map((rel) => rel.parser_manifest_id)
                );

                let parserIds = Array.from(parserIdsForStudyType);

                if (selectedFacilityIds.length > 0) {
                    const parserIdsMatchingFacilities = parserIds.filter((parserId) =>
                        parserIdsForFacilities.has(parserId)
                    );

                    if (parserIdsMatchingFacilities.length > 0) {
                        parserIds = parserIdsMatchingFacilities;
                    }
                }

                if (parserIds.length === 0) {
                    setStudyTypeVariables([]);
                    setRelatedCriteria([]);
                    return;
                }

                const [parserVariablesResponses, criteriaResponses] = await Promise.all([
                    Promise.all(parserIds.map((parserId) => criteriaService.listParserVariables(parserId))),
                    Promise.all(parserIds.map((parserId) => criteriaService.list(parserId, false))),
                ]);

                const allItems = parserVariablesResponses.flatMap((items) => items || []);
                const allCriteria = criteriaResponses.flatMap((items) => items || []);

                const uniqueBySignature = new Map<string, StudyTypeVariableItem>();
                allItems.forEach((item) => {
                    const typedItem = item as ParserCriterionVariable;
                    const variableName = (typedItem.variable_name || typedItem.variable_key || '').trim();
                    const signature = (
                        typedItem.semantic_signature ||
                        typedItem.variable_key ||
                        variableName
                    ).trim().toLowerCase();

                    if (signature && !uniqueBySignature.has(signature)) {
                        uniqueBySignature.set(signature, {
                            key: typedItem.variable_key || variableName,
                            displayName: variableName,
                            variableName,
                            canonicalCode: typedItem.canonical_code,
                            unit: typedItem.unit,
                        });
                    }
                });

                const variables = Array.from(uniqueBySignature.values()).sort((a, b) => {
                    const nameA = (a.displayName || "").toLowerCase();
                    const nameB = (b.displayName || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                const uniqueCriteria = new Map<number, StructuredCriterion>();
                allCriteria
                    .filter((criterion) => criterion.active !== false)
                    .forEach((criterion) => {
                        uniqueCriteria.set(criterion.id, criterion);
                    });

                const criteriaList = Array.from(uniqueCriteria.values()).sort(
                    (a, b) => (a.priority || 9999) - (b.priority || 9999)
                );

                setStudyTypeVariables(variables);
                setRelatedCriteria(criteriaList);
            } catch (error: any) {
                setStudyTypeVariables([]);
                setRelatedCriteria([]);
                setStudyTypeVariablesError(
                    error?.response?.data?.error || "No se pudieron cargar variables relacionadas al tipo de estudio"
                );
                setRelatedCriteriaError(
                    error?.response?.data?.error || "No se pudieron cargar criterios relacionados al tipo de estudio"
                );
            } finally {
                setIsLoadingStudyTypeVariables(false);
                setIsLoadingRelatedCriteria(false);
            }
        };

        loadRelatedData();
    }, [studyTypeFilter, reportType, selectedFacilityIds]);

    // Handler para guardar template
    const handleSaveTemplate = async () => {
        if (!title.trim()) {
            toast.error("El título es obligatorio");
            return;
        }
        if (!studyTypeFilter.trim()) {
            toast.error("Debe seleccionar un tipo de estudio");
            return;
        }
        if (reportType === 'inteligente' && selectedLocationIds.length === 0) {
            toast.error("Debe vincular al menos una location para informes inteligentes");
            return;
        }

        try {
            // Leer el contenido directamente desde los editores TipTap para evitar
            // problemas de sincronización entre el estado React y el contenido del editor
            // (p.ej. cuando el usuario inserta [[ ]] y guarda sin volver a enfocar el editor).
            const rawTechnique  = (editorsRef.current['technique']  as any)?.getHTML?.() ?? technique;
            const rawFindings   = (editorsRef.current['findings']   as any)?.getHTML?.() ?? findings;
            const rawImpression = (editorsRef.current['impression'] as any)?.getHTML?.() ?? impression;
            const rawConclusion = (editorsRef.current['conclusion'] as any)?.getHTML?.() ?? conclusion;

            const sanitizedTechnique = reportType === 'simple' ? stripVariablePlaceholdersFromHtml(rawTechnique) : rawTechnique;
            const sanitizedFindings = reportType === 'simple' ? stripVariablePlaceholdersFromHtml(rawFindings) : rawFindings;
            const sanitizedImpression = reportType === 'simple' ? stripVariablePlaceholdersFromHtml(rawImpression) : rawImpression;
            const sanitizedConclusion = reportType === 'simple' ? stripVariablePlaceholdersFromHtml(rawConclusion) : rawConclusion;

            const templatePayload = {
                title: title.trim(),
                study_type_id: studyTypeFilter,
                findings: sanitizedFindings?.trim() || undefined,
                technique: sanitizedTechnique?.trim() || undefined,
                impression: sanitizedImpression?.trim() || undefined,
                conclusion: sanitizedConclusion?.trim() || undefined,
                report_type: reportType,
                location_ids: reportType === 'inteligente' ? selectedLocationIds : [],
                structured_variables: reportType === 'simple' ? '' : structuredVariables,
                criteria: reportType === 'simple' ? '' : criteria,
                is_default: isDefaultReport
            };

            if (isEditMode && id) {
                // Modo edición: actualizar plantilla existente
                await updateTemplateMutation.mutateAsync({
                    id,
                    data: templatePayload
                });

                if (reportType === 'simple') {
                    setTechnique(sanitizedTechnique || '');
                    setFindings(sanitizedFindings || '');
                    setImpression(sanitizedImpression || '');
                    setConclusion(sanitizedConclusion || '');
                    setStructuredVariables('');
                    setCriteria('');
                    setSelectedLocationIds([]);
                }

                toast.success("Plantilla actualizada exitosamente");
            } else {
                // Modo creación: crear nueva plantilla
                await createTemplateMutation.mutateAsync(templatePayload);
                toast.success("Plantilla creada exitosamente");

                // En creación volvemos al listado; en edición permanecemos en la vista actual
                navigate('/estudios/informes-predefinidos');
            }
        } catch (error: any) {
            const errorMessage = isEditMode
                ? "Error al actualizar la plantilla"
                : "Error al crear la plantilla";
            toast.error(error?.response?.data?.message || errorMessage);
        }
    };

    // Resetear página cuando cambian los filtros
    const handleFilterChange = (value: string) => {
        setStudyTypeFilter(value);
    };
    // Preparar opciones para el Autocomplete
    const tiposEstudioOptions = useMemo(() => {
        if (!Array.isArray(tiposEstudio?.data)) return [];
        return tiposEstudio.data.map((estudio: any) => ({
            value: estudio.guid,
            label: estudio.description
        }));
    }, [tiposEstudio]);

    const reportTypeOptions = useMemo(() => ([
        { value: 'simple', label: 'Simple' },
        { value: 'inteligente', label: 'Inteligente' },
    ]), []);

    const filteredStudyTypeVariables = useMemo(() => {
        const term = variablesSearchTerm.trim().toLowerCase();
        if (!term) return studyTypeVariables;
        return studyTypeVariables.filter((variable) =>
            [variable.displayName, variable.key, variable.canonicalCode || '']
                .join(' ')
                .toLowerCase()
                .includes(term)
        );
    }, [studyTypeVariables, variablesSearchTerm]);

    const locationOptions = useMemo<AutocompleteOption[]>(() => {
        if (!Array.isArray(locationsData?.data)) return [];
        return locationsData.data.map((location: any) => ({
            value: location.guid,
            label: location.description || location.name || location.guid,
        }));
    }, [locationsData]);

    const filteredLocationOptions = useMemo(() => {
        const term = locationsSearchTerm.trim().toLowerCase();
        if (!term) return locationOptions;
        return locationOptions.filter((location: AutocompleteOption) =>
            (location.label || '').toLowerCase().includes(term)
        );
    }, [locationOptions, locationsSearchTerm]);

    const toggleLocation = (locationId: string) => {
        setSelectedLocationIds((prev) =>
            prev.includes(locationId)
                ? prev.filter((id) => id !== locationId)
                : [...prev, locationId]
        );
    };

    const showStructuredTabs = reportType !== 'simple';



    useEffect(() => {
        if (!showStructuredTabs && rightMetaTab !== 'info') {
            setRightMetaTab('info');
        }
    }, [showStructuredTabs, rightMetaTab]);

    // Mostrar loader mientras se cargan los datos en modo edición
    if (isEditMode && isLoadingTemplate) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
                        <p className="text-gray-600">Cargando plantilla...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="h-full min-h-0 bg-gray-50 dark:bg-[#0f1218] rounded-xl p-2 dark:text-gray-100 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-3 shrink-0">
                    <div className="relative bg-white dark:bg-[#151922] rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-3 text-gray-800 dark:text-gray-100">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(-1)}
                                className="text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1e2430]"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="bg-gray-100 dark:bg-[#1e2430] p-2 rounded-lg">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                            <h1 className="text-2xl font-semibold">
                                {isEditMode ? "Editar Informe Predefinido" : "Crear Informe Predefinido"}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1e2430] font-mono"
                                disabled={!activeEditor}
                                title="Insertar [[ ]] en el cursor (placeholder de informe)"
                                onClick={() => {
                                    if (!activeEditor) return;
                                    activeEditor.chain().focus().insertContent('[[ ]]').run();
                                }}
                            >
                                [[ ]]
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-brand-purple border-brand-purple text-white hover:bg-brand-purple/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending || isLoadingTemplate}
                                onClick={handleSaveTemplate}
                            >
                                {createTemplateMutation.isPending || updateTemplateMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        GUARDANDO...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {isEditMode ? "ACTUALIZAR" : "GUARDAR"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Layout principal como Redactar Informe */}
                <div className="flex-1 min-h-0 relative">
                    <div className="flex gap-1 h-full">
                        {/* Columna Izquierda: Redacción */}
                        <div className="flex-1 space-y-2.5 p-2.5 transition-all ease-in-out min-w-0 bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto h-full table-scrollbar-purple">
                        {/* Toolbar única global */}
                        <div className="sticky top-0 z-20 bg-gray-50 dark:bg-[#0f1218] rounded-md border border-gray-200 dark:border-gray-700 p-1.5 flex items-center gap-0.5 flex-wrap">
                            <button onClick={() => activeEditor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Negrita" disabled={!activeEditor}><Bold className="w-4 h-4 dark:text-gray-200" /></button>
                            <button onClick={() => activeEditor?.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Cursiva" disabled={!activeEditor}><Italic className="w-4 h-4 dark:text-gray-200" /></button>
                            <button onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('underline') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Subrayado" disabled={!activeEditor}><UnderlineIcon className="w-4 h-4 dark:text-gray-200" /></button>
                            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                            <button onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Lista numerada" disabled={!activeEditor}><ListOrdered className="w-4 h-4 dark:text-gray-200" /></button>
                            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                            <button onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'left' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Alinear izquierda" disabled={!activeEditor}><AlignLeft className="w-4 h-4 dark:text-gray-200" /></button>
                            <button onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'center' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Centrar" disabled={!activeEditor}><AlignCenter className="w-4 h-4 dark:text-gray-200" /></button>
                            <button onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'right' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Alinear derecha" disabled={!activeEditor}><AlignRight className="w-4 h-4 dark:text-gray-200" /></button>
                            <button onClick={() => activeEditor?.chain().focus().setTextAlign('justify').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'justify' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Justificar" disabled={!activeEditor}><AlignJustify className="w-4 h-4 dark:text-gray-200" /></button>
                            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                            <button onClick={() => activeEditor?.chain().focus().undo().run()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600" type="button" title="Deshacer" disabled={!activeEditor || !activeEditor?.can?.().undo()}><Undo className="w-4 h-4 dark:text-gray-200" /></button>
                            <button onClick={() => activeEditor?.chain().focus().redo().run()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600" type="button" title="Rehacer" disabled={!activeEditor || !activeEditor?.can?.().redo()}><Redo className="w-4 h-4 dark:text-gray-200" /></button>
                        </div>

                        {/* Técnica de examen */}
                        <Card className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden p-0">
                            <div
                                className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                onClick={() => toggleSection('tecnica')}
                            >
                                <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Técnica de examen</h3>
                                {openSections.tecnica ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                            </div>

                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tecnica ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-2 py-1">
                                    <RichTextEditor
                                        value={technique}
                                        onChange={setTechnique}
                                        placeholder="Escribe la técnica del examen..."
                                        onEditorReady={(editor) => handleEditorReady(editor, 'technique')}
                                        dragOver={dragOverEditorField === 'technique'}
                                        onDragOver={(e) => handleEditorDragOver(e, 'technique')}
                                        onDragLeave={handleEditorDragLeave}
                                        onDrop={(e) => handleVariableDropInEditor(e, 'technique')}
                                        showToolbar={false}
                                        variableChipTone='default'
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Hallazgos */}
                        <Card className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden p-0">
                            <div
                                className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                onClick={() => toggleSection('hallazgos')}
                            >
                                <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Hallazgos</h3>
                                {openSections.hallazgos ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                            </div>

                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.hallazgos ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-2 py-1">
                                    <RichTextEditor
                                        value={findings}
                                        onChange={setFindings}
                                        placeholder="Escribe los hallazgos..."
                                        onEditorReady={(editor) => handleEditorReady(editor, 'findings')}
                                        dragOver={dragOverEditorField === 'findings'}
                                        onDragOver={(e) => handleEditorDragOver(e, 'findings')}
                                        onDragLeave={handleEditorDragLeave}
                                        onDrop={(e) => handleVariableDropInEditor(e, 'findings')}
                                        showToolbar={false}
                                        variableChipTone='default'
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Impresiones */}
                        <Card className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden p-0">
                            <div
                                className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                onClick={() => toggleSection('impresiones')}
                            >
                                <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Impresiones</h3>
                                {openSections.impresiones ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                            </div>

                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.impresiones ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-2 py-1">
                                    <RichTextEditor
                                        value={impression}
                                        onChange={setImpression}
                                        placeholder="Escribe las impresiones..."
                                        onEditorReady={(editor) => handleEditorReady(editor, 'impression')}
                                        dragOver={dragOverEditorField === 'impression'}
                                        onDragOver={(e) => handleEditorDragOver(e, 'impression')}
                                        onDragLeave={handleEditorDragLeave}
                                        onDrop={(e) => handleVariableDropInEditor(e, 'impression')}
                                        showToolbar={false}
                                        variableChipTone='default'
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Conclusiones */}
                        <Card className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden p-0">
                            <div
                                className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                onClick={() => toggleSection('conclusiones')}
                            >
                                <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Conclusiones</h3>
                                {openSections.conclusiones ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                            </div>

                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.conclusiones ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-2 py-1">
                                    <RichTextEditor
                                        value={conclusion}
                                        onChange={setConclusion}
                                        placeholder="Escribe las conclusiones..."
                                        onEditorReady={(editor) => handleEditorReady(editor, 'conclusion')}
                                        dragOver={dragOverEditorField === 'conclusion'}
                                        onDragOver={(e) => handleEditorDragOver(e, 'conclusion')}
                                        onDragLeave={handleEditorDragLeave}
                                        onDrop={(e) => handleVariableDropInEditor(e, 'conclusion')}
                                        showToolbar={false}
                                        variableChipTone='default'
                                    />
                                </div>
                            </div>
                        </Card>
                        </div>

                        {/* Toggle central como Redactar Informe */}
                        <div className="self-stretch hidden lg:block">
                            <button
                                onClick={() => setIsStudySidebarOpen((prev) => !prev)}
                                className="bg-gray-200 dark:bg-[#1f2937] h-full hover:bg-gray-300 dark:hover:bg-[#2a3444] text-gray-700 dark:text-gray-200 p-1.5 rounded-md border border-gray-300 dark:border-gray-700 transition-colors"
                                title={isStudySidebarOpen ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}
                                type="button"
                            >
                                {isStudySidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Columna Derecha: secciones de metadata */}
                        {isStudySidebarOpen && (
                            <div className="w-full lg:w-[360px] shrink-0 h-full overflow-y-auto table-scrollbar-purple">
                                <Card className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden p-0">
                                    <div className="bg-gray-100 dark:bg-[#1e2430] px-2 py-2 border-b border-gray-200 dark:border-gray-700">
                                        <div className={`grid gap-1 ${showStructuredTabs ? 'grid-cols-3' : 'grid-cols-1'}`}>
                                            <button
                                                type="button"
                                                onClick={() => setRightMetaTab('info')}
                                                className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${rightMetaTab === 'info'
                                                        ? 'bg-white dark:bg-[#151922] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#273043]'
                                                    }`}
                                            >
                                                Informacion general
                                            </button>
                                            {showStructuredTabs && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRightMetaTab('variables')}
                                                        className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${rightMetaTab === 'variables'
                                                                ? 'bg-white dark:bg-[#151922] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#273043]'
                                                            }`}
                                                    >
                                                        Variables
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRightMetaTab('criterios')}
                                                        className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${rightMetaTab === 'criterios'
                                                                ? 'bg-white dark:bg-[#151922] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#273043]'
                                                            }`}
                                                    >
                                                        Criterios
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {rightMetaTab === 'info' && (
                                        <div className="p-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                                    Título del informe:
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="Título del informe"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                                    Tipo de estudio:
                                                </label>
                                                <Autocomplete
                                                    options={tiposEstudioOptions}
                                                    value={studyTypeFilter}
                                                    onValueChange={handleFilterChange}
                                                    placeholder="Filtrar por tipo de estudio"
                                                    emptyMessage="No se encontraron tipos de estudio."
                                                    searchPlaceholder="Buscar tipo de estudio..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                                    Tipo de informe:
                                                </label>
                                                {isSysadmin ? (
                                                    <Autocomplete
                                                        options={reportTypeOptions}
                                                        value={reportType}
                                                        onValueChange={(value) => setReportType((value || 'simple') as ReportType)}
                                                        placeholder="Seleccionar tipo de informe"
                                                        emptyMessage="No se encontraron tipos de informe."
                                                        searchPlaceholder="Buscar tipo de informe..."
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1e2430] text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed select-none">
                                                        <Lock className="h-3.5 w-3.5 shrink-0" />
                                                        <span>Simple</span>
                                                    </div>
                                                )}
                                            </div>

                                            {reportType === 'inteligente' && (
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Locations vinculadas:
                                                    </label>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Seleccione una o mas locations para este informe inteligente.
                                                    </p>

                                                    <Input
                                                        value={locationsSearchTerm}
                                                        onChange={(e) => setLocationsSearchTerm(e.target.value)}
                                                        placeholder="Buscar location..."
                                                    />

                                                    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1218] p-2 max-h-[220px] overflow-y-auto table-scrollbar-purple space-y-1">
                                                        {isLoadingLocations && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Cargando locations...</p>
                                                        )}

                                                        {!isLoadingLocations && filteredLocationOptions.length === 0 && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">No se encontraron locations.</p>
                                                        )}

                                                        {!isLoadingLocations && filteredLocationOptions.map((location) => (
                                                            <label
                                                                key={location.value}
                                                                className="flex items-center gap-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151922] px-2 py-1.5 cursor-pointer"
                                                            >
                                                                <Checkbox
                                                                    checked={selectedLocationIds.includes(location.value)}
                                                                    onCheckedChange={() => toggleLocation(location.value)}
                                                                />
                                                                <span className="text-xs text-gray-700 dark:text-gray-200">{location.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    {selectedLocationIds.length > 0 && (
                                                        <p className="text-xs text-brand-purple">
                                                            {selectedLocationIds.length} location(es) seleccionada(s)
                                                        </p>
                                                    )}
                                                </div>
                                            )}



                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="default-report"
                                                    checked={isDefaultReport}
                                                    onCheckedChange={(checked) => setIsDefaultReport(checked === true)}
                                                />
                                                <label
                                                    htmlFor="default-report"
                                                    className="text-sm font-medium text-gray-700 cursor-pointer select-none dark:text-gray-300"
                                                >
                                                    Configurar como informe por defecto
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {showStructuredTabs && rightMetaTab === 'variables' && (
                                        <div className="p-3">
                                            <div className="mb-3">
                                                <textarea
                                                    value={structuredVariables}
                                                    onChange={(e) => setStructuredVariables(e.target.value)}
                                                    placeholder="Notas de variables estructuradas para este informe predefinido..."
                                                    className="w-full min-h-[90px] p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e2430] text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                                                />
                                            </div>

                                            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1218] p-2">
                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Variables del parser asociado al tipo de estudio
                                                </p>

                                                <div className="mb-2">
                                                    <Input
                                                        value={variablesSearchTerm}
                                                        onChange={(e) => setVariablesSearchTerm(e.target.value)}
                                                        placeholder="Buscar variable..."
                                                    />
                                                </div>

                                                {!studyTypeFilter && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Selecciona un tipo de estudio en Informacion general para listar variables.
                                                    </p>
                                                )}

                                                {studyTypeFilter && isLoadingStudyTypeVariables && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Cargando variables...</p>
                                                )}

                                                {studyTypeFilter && !isLoadingStudyTypeVariables && studyTypeVariablesError && (
                                                    <p className="text-xs text-red-500">{studyTypeVariablesError}</p>
                                                )}

                                                {studyTypeFilter && !isLoadingStudyTypeVariables && !studyTypeVariablesError && studyTypeVariables.length === 0 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        No hay variables relacionadas al parser para este tipo de estudio.
                                                    </p>
                                                )}

                                                {studyTypeFilter && !isLoadingStudyTypeVariables && !studyTypeVariablesError && studyTypeVariables.length > 0 && filteredStudyTypeVariables.length === 0 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        No se encontraron variables para la busqueda.
                                                    </p>
                                                )}

                                                {studyTypeFilter && !isLoadingStudyTypeVariables && !studyTypeVariablesError && filteredStudyTypeVariables.length > 0 && (
                                                    <div className="max-h-[280px] overflow-y-auto table-scrollbar-purple space-y-1 pr-1">
                                                        {filteredStudyTypeVariables.map((variable) => (
                                                            <div
                                                                key={variable.key}
                                                                className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151922] p-2 cursor-grab active:cursor-grabbing"
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    const variableName = variable.variableName || variable.displayName || "";
                                                                    handleVariableDragStart(variableName);
                                                                    e.dataTransfer.setData('application/x-variable-name', variableName);
                                                                    e.dataTransfer.setData('text/plain', variableName);
                                                                    e.dataTransfer.effectAllowed = 'copy';
                                                                }}
                                                                onDragEnd={handleVariableDragEnd}
                                                            >
                                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                                                                    {variable.displayName}
                                                                </p>
                                                                {(variable.canonicalCode || variable.unit) && (
                                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                                        {[variable.canonicalCode, variable.unit].filter(Boolean).join(' · ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {showStructuredTabs && rightMetaTab === 'criterios' && (
                                        <div className="p-3">
                                            <textarea
                                                value={criteria}
                                                onChange={(e) => setCriteria(e.target.value)}
                                                placeholder="Agrega criterios, reglas o validaciones para el uso de esta plantilla..."
                                                className="w-full min-h-[120px] p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e2430] text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                                            />

                                            <div className="mt-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1218] p-2">
                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Criterios del parser asociado al tipo de estudio
                                                </p>

                                                {!studyTypeFilter && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Selecciona un tipo de estudio en Informacion general para listar criterios.
                                                    </p>
                                                )}

                                                {studyTypeFilter && isLoadingRelatedCriteria && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Cargando criterios...</p>
                                                )}

                                                {studyTypeFilter && !isLoadingRelatedCriteria && relatedCriteriaError && (
                                                    <p className="text-xs text-red-500">{relatedCriteriaError}</p>
                                                )}

                                                {studyTypeFilter && !isLoadingRelatedCriteria && !relatedCriteriaError && relatedCriteria.length === 0 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        No hay criterios relacionados para esta seleccion.
                                                    </p>
                                                )}

                                                {studyTypeFilter && !isLoadingRelatedCriteria && !relatedCriteriaError && relatedCriteria.length > 0 && (
                                                    <div className="max-h-[240px] overflow-y-auto table-scrollbar-purple space-y-1 pr-1">
                                                        {relatedCriteria.map((criterion) => (
                                                            <div
                                                                key={criterion.id}
                                                                className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151922] p-2 cursor-grab active:cursor-grabbing"
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    const criterionName = criterion.criterion_name || "";
                                                                    handleCriterionDragStart(criterionName);
                                                                    e.dataTransfer.setData('application/x-criterion-name', criterionName);
                                                                    e.dataTransfer.setData('text/plain', criterionName);
                                                                    e.dataTransfer.effectAllowed = 'copy';
                                                                }}
                                                                onDragEnd={handleVariableDragEnd}
                                                            >
                                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                                                                    {criterion.criterion_name}
                                                                </p>
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                                    Prioridad: {criterion.priority}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
