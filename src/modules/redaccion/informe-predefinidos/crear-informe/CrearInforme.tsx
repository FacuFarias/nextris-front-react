import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/layouts/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Save, ChevronDown, ChevronUp, ArrowLeft, Loader2, Bold, Italic, Underline as UnderlineIcon, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useCreateTemplate, useUpdateTemplate, useTemplate } from "../hooks/use-templates";
import { usePlaceholderNavigation } from "../hooks/use-placeholder-navigation";
import { toast } from "sonner";
import { useTiposEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/tipos-estudio";
import { Autocomplete } from "@/components/autocomplete";
import { parserFacilityRelService } from "@/services/parser-facility-rel.service";
import { variableMappingService, type VariableMappingItem } from "@/services/variable-mapping.service";

export const CrearInforme = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Obtener el ID de la URL
    const isEditMode = !!id; // Determinar si estamos en modo edición

    // Cargar datos de la plantilla si estamos en modo edición
    const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(id || '');

    // Form states
    const [title, setTitle] = useState("");
    const [findings, setFindings] = useState("");
    const [impression, setImpression] = useState("");
    const [conclusion, setConclusion] = useState("");
    const [technique, setTechnique] = useState("");
    const [isDefaultReport, setIsDefaultReport] = useState(false);
    const [studyTypeFilter, setStudyTypeFilter] = useState<string>("");
    const [isStudySidebarOpen, setIsStudySidebarOpen] = useState(true);
    const [structuredVariables, setStructuredVariables] = useState("");
    const [criteria, setCriteria] = useState("");
    const [rightMetaTab, setRightMetaTab] = useState<'info' | 'variables' | 'criterios'>('info');
    const [studyTypeVariables, setStudyTypeVariables] = useState<VariableMappingItem[]>([]);
    const [isLoadingStudyTypeVariables, setIsLoadingStudyTypeVariables] = useState(false);
    const [studyTypeVariablesError, setStudyTypeVariablesError] = useState<string>("");
    const [variablesSearchTerm, setVariablesSearchTerm] = useState("");
    const [dragOverEditorField, setDragOverEditorField] = useState<(typeof editorFieldOrder)[number] | null>(null);
    const draggedVariableNameRef = useRef<string>("");

    // Hook para navegación de placeholders con F3
    const editorFieldOrder = ['technique', 'findings', 'impression', 'conclusion'] as const;
    const { editorsRef } = usePlaceholderNavigation(editorFieldOrder as unknown as string[]);
    const [activeEditorField, setActiveEditorField] = useState<(typeof editorFieldOrder)[number] | null>(null);
    const currentFieldRef = useRef<(typeof editorFieldOrder)[number] | null>(null);
    const { tiposEstudio } = useTiposEstudio();

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
        draggedVariableNameRef.current = normalized;
    };

    const handleVariableDragEnd = () => {
        setDragOverEditorField(null);
        draggedVariableNameRef.current = '';
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
        const variableName = (
            draggedVariableNameRef.current ||
            e.dataTransfer.getData('application/x-variable-name') ||
            e.dataTransfer.getData('text/plain') ||
            ''
        ).trim();
        const editor = editorsRef.current[fieldName] as any;

        if (editor && variableName) {
            editor
                .chain()
                .focus()
                .insertContent([
                    {
                        type: 'variableChip',
                        attrs: {
                            variableName,
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
            setStructuredVariables((template as any).structured_variables || "");
            setCriteria((template as any).criteria || "");
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

    // Cargar variables de parser relacionadas al study type seleccionado
    useEffect(() => {
        const loadStudyTypeVariables = async () => {
            if (!studyTypeFilter) {
                setStudyTypeVariables([]);
                setStudyTypeVariablesError("");
                return;
            }

            setIsLoadingStudyTypeVariables(true);
            setStudyTypeVariablesError("");

            try {
                const [parsers, relations] = await Promise.all([
                    parserFacilityRelService.listParsers(),
                    parserFacilityRelService.listStudytypeRelations(),
                ]);

                const parserIdsForStudyType = new Set(
                    relations
                        .filter((rel) => String(rel.studytype_guid) === String(studyTypeFilter))
                        .map((rel) => rel.parser_manifest_id)
                );

                const parserFamilies = Array.from(
                    new Set(
                        parsers
                            .filter((parser) => parserIdsForStudyType.has(parser.id))
                            .map((parser) => parser.parser_family)
                            .filter(Boolean)
                    )
                );

                if (parserFamilies.length === 0) {
                    setStudyTypeVariables([]);
                    return;
                }

                const mappingsResponses = await Promise.all(
                    parserFamilies.map((family) => variableMappingService.listMappings(family, "generic"))
                );

                const allItems = mappingsResponses.flatMap((response) => response.items || []);

                const uniqueBySignature = new Map<string, VariableMappingItem>();
                allItems.forEach((item) => {
                    const key = (item.canonical_name || "").trim().toLowerCase();

                    if (key && !uniqueBySignature.has(key)) {
                        uniqueBySignature.set(key, item);
                    }
                });

                const variables = Array.from(uniqueBySignature.values()).sort((a, b) => {
                    const nameA = (a.canonical_name || "").toLowerCase();
                    const nameB = (b.canonical_name || "").toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                setStudyTypeVariables(variables);
            } catch (error: any) {
                setStudyTypeVariables([]);
                setStudyTypeVariablesError(
                    error?.response?.data?.error || "No se pudieron cargar variables relacionadas al tipo de estudio"
                );
            } finally {
                setIsLoadingStudyTypeVariables(false);
            }
        };

        loadStudyTypeVariables();
    }, [studyTypeFilter]);

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

        try {
            const templatePayload = {
                title: title.trim(),
                study_type_id: studyTypeFilter,
                findings: findings.trim() || undefined,
                technique: technique.trim() || undefined,
                impression: impression.trim() || undefined,
                conclusion: conclusion.trim() || undefined,
                is_default: isDefaultReport
            };

            if (isEditMode && id) {
                // Modo edición: actualizar plantilla existente
                await updateTemplateMutation.mutateAsync({
                    id,
                    data: templatePayload
                });
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

    const filteredStudyTypeVariables = useMemo(() => {
        const term = variablesSearchTerm.trim().toLowerCase();
        if (!term) return studyTypeVariables;
        return studyTypeVariables.filter((variable) =>
            (variable.canonical_name || '').toLowerCase().includes(term)
        );
    }, [studyTypeVariables, variablesSearchTerm]);

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
        <MainLayout isOverflow={false}>
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
                                        <div className="grid grid-cols-3 gap-1">
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

                                    {rightMetaTab === 'variables' && (
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
                                                    Variables del parser relacionadas al tipo de estudio
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
                                                                key={variable.canonical_name}
                                                                className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151922] p-2 cursor-grab active:cursor-grabbing"
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    const variableName = variable.canonical_name || "";
                                                                    handleVariableDragStart(variableName);
                                                                    e.dataTransfer.setData('application/x-variable-name', variableName);
                                                                    e.dataTransfer.setData('text/plain', variableName);
                                                                    e.dataTransfer.effectAllowed = 'copy';
                                                                }}
                                                                onDragEnd={handleVariableDragEnd}
                                                            >
                                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                                                                    {variable.canonical_name}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {rightMetaTab === 'criterios' && (
                                        <div className="p-3">
                                            <textarea
                                                value={criteria}
                                                onChange={(e) => setCriteria(e.target.value)}
                                                placeholder="Agrega criterios, reglas o validaciones para el uso de esta plantilla..."
                                                className="w-full min-h-[120px] p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e2430] text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                                            />
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
