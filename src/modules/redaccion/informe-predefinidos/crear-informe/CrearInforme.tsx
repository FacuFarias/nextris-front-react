import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/layouts/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Search, Save, Edit, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { useTemplates, useCreateTemplate } from "../hooks/use-templates";
import { usePlaceholderNavigation } from "../hooks/use-placeholder-navigation";
import type { Template } from "../types/informe-pred.types";
import { toast } from "sonner";

export const CrearInforme = () => {
    const navigate = useNavigate();
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Form states
    const [title, setTitle] = useState("");
    const [studyType, setStudyType] = useState("");
    const [studyTypeId, setStudyTypeId] = useState("");
    const [findings, setFindings] = useState("");
    const [impression, setImpression] = useState("");
    const [conclusion, setConclusion] = useState("");
    const [technique, setTechnique] = useState("");
    const [isDefaultReport, setIsDefaultReport] = useState(false);

    // Estado para guardar valores originales y detectar cambios
    const [originalValues, setOriginalValues] = useState({
        title: "",
        technique: "",
        findings: "",
        impression: "",
        conclusion: "",
        isDefaultReport: false
    });

    // Hook para navegación de placeholders con F3
    const { editorsRef } = usePlaceholderNavigation(['technique', 'findings', 'impression', 'conclusion']);

    // Estado para controlar qué secciones están abiertas/cerradas
    const [openSections, setOpenSections] = useState({
        listaInformes: true,
        tituloYTipo: true,
        tecnica: true,
        hallazgos: true,
        impresiones: true,
        conclusiones: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const { data, isLoading } = useTemplates();
    const createTemplateMutation = useCreateTemplate();

    // Filtrar plantillas por búsqueda
    const filteredTemplates = data?.data?.filter((template) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            template.title.toLowerCase().includes(searchLower) ||
            template.study_type_description?.toLowerCase().includes(searchLower)
        );
    }) || [];

    // Paginación
    const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + itemsPerPage);

    const handleSelectTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setIsCreatingNew(false);
        setIsEditMode(false);
        const initialTitle = template.title;
        const initialTechnique = template.technique || "";
        const initialFindings = template.findings || "";
        const initialImpression = template.impression || "";
        const initialConclusion = template.conclusion || "";

        setTitle(initialTitle);
        setStudyType(template.study_type_description || "");
        setStudyTypeId(template.study_type_id);
        setFindings(initialFindings);
        setImpression(initialImpression);
        setConclusion(initialConclusion);
        setTechnique(initialTechnique);
        setIsDefaultReport(false);

        // Guardar valores originales para comparar cambios
        setOriginalValues({
            title: initialTitle,
            technique: initialTechnique,
            findings: initialFindings,
            impression: initialImpression,
            conclusion: initialConclusion,
            isDefaultReport: false
        });
    };

    const isFieldsLocked = (!selectedTemplate && !isCreatingNew) || !isEditMode;

    // Handler para crear nuevo template
    const handleCreateNew = () => {
        setIsCreatingNew(true);
        setSelectedTemplate(null);
        setIsEditMode(true);
        setTitle("");
        setStudyType("");
        setStudyTypeId("");
        setFindings("");
        setImpression("");
        setConclusion("");
        setTechnique("");
        setIsDefaultReport(false);
        setOriginalValues({
            title: "",
            technique: "",
            findings: "",
            impression: "",
            conclusion: "",
            isDefaultReport: false
        });
    };

    // Handler para guardar template
    const handleSaveTemplate = async () => {
        if (!title.trim()) {
            toast.error("El título es obligatorio");
            return;
        }

        if (!studyTypeId.trim()) {
            toast.error("Debe seleccionar un tipo de estudio");
            return;
        }

        try {
            await createTemplateMutation.mutateAsync({
                title: title.trim(),
                study_type_id: studyTypeId,
                findings: findings.trim() || undefined,
                technique: technique.trim() || undefined,
                impression: impression.trim() || undefined,
                conclusion: conclusion.trim() || undefined,
                is_default: isDefaultReport
            });

            toast.success("Plantilla creada exitosamente");

            // Resetear formulario
            setIsCreatingNew(false);
            setIsEditMode(false);
            setTitle("");
            setStudyType("");
            setStudyTypeId("");
            setFindings("");
            setImpression("");
            setConclusion("");
            setTechnique("");
            setIsDefaultReport(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Error al crear la plantilla");
        }
    };

    // Detectar si hay cambios en el formulario
    const hasChanges = useMemo(() => {
        // En modo crear, verificar si hay contenido
        if (isCreatingNew) {
            return (
                title.trim() !== "" ||
                technique.trim() !== "" ||
                findings.trim() !== "" ||
                impression.trim() !== "" ||
                conclusion.trim() !== "" ||
                isDefaultReport !== false
            );
        }

        // En modo editar, comparar con valores originales
        if (!selectedTemplate) return false;

        return (
            title !== originalValues.title ||
            technique !== originalValues.technique ||
            findings !== originalValues.findings ||
            impression !== originalValues.impression ||
            conclusion !== originalValues.conclusion ||
            isDefaultReport !== originalValues.isDefaultReport
        );
    }, [isCreatingNew, title, technique, findings, impression, conclusion, isDefaultReport, originalValues, selectedTemplate]);

    return (
        <MainLayout>
            {/* Header */}
            <div className="bg-brand-purple px-6 py-6 mb-6 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="text-white hover:bg-white/20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-semibold">Crear Informe Predefinido</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
                            <Input
                                type="text"
                                placeholder="Buscar informe predefinido..."
                                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={(!selectedTemplate && !isCreatingNew) || !hasChanges || createTemplateMutation.isPending}
                            onClick={handleSaveTemplate}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {createTemplateMutation.isPending ? "GUARDANDO..." : "GUARDAR"}
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                            onClick={() => setIsEditMode(!isEditMode)}
                            disabled={!selectedTemplate || isCreatingNew}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            {isEditMode ? 'BLOQUEAR' : 'EDITAR'}
                        </Button>
                        <Button
                            className="bg-white text-purple-600 hover:bg-white/90"
                            onClick={handleCreateNew}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            AGREGAR
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Lista de informes */}
                    <Card className="shadow-lg overflow-hidden p-0">
                        <div
                            className="bg-brand-purple px-4 py-3 cursor-pointer flex justify-between items-center"
                            onClick={() => toggleSection('listaInformes')}
                        >
                            <h3 className="text-white font-semibold">Lista de informes</h3>
                            {openSections.listaInformes ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                        </div>

                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.listaInformes ? 'max-h-[13000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-4">
                                {/* Buscador pequeño */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-10 h-9"
                                    />
                                </div>

                                {/* Tabla de plantillas */}
                                <div className="space-y-2 max-h-[700px] overflow-y-auto">
                                    {isLoading ? (
                                        <div className="text-center py-8 text-gray-500">Cargando...</div>
                                    ) : paginatedTemplates.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">No se encontraron informes</div>
                                    ) : (
                                        paginatedTemplates.map((template) => (
                                            <div
                                                key={template.guid}
                                                onClick={() => handleSelectTemplate(template)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-300 ${selectedTemplate?.guid === template.guid
                                                    ? "bg-blue-100 border-blue-400"
                                                    : "bg-gray-50 border-gray-200"
                                                    }`}
                                            >
                                                <div className="font-medium text-gray-700">{template.title}</div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {template.study_type_description}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Paginación */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm text-gray-600">
                                            Página {currentPage} de {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Título y tipo de estudio */}
                    <Card className="shadow-lg overflow-hidden p-0">
                        <div
                            className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                            onClick={() => toggleSection('tituloYTipo')}
                        >
                            <h3 className="text-white font-semibold">Título y tipo de estudio</h3>
                            <div className="flex items-center gap-2">
                                {isFieldsLocked && (
                                    <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Campo bloqueado
                                    </span>
                                )}
                                {openSections.tituloYTipo ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                        </div>

                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tituloYTipo ? 'max-h-[1000px] min-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Título del informe:
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Título del informe"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={isFieldsLocked}
                                        className="disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de estudio:
                                    </label>
                                    <Input
                                        type="text"
                                        value={studyType}
                                        disabled={true}
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="default-report"
                                        checked={isDefaultReport}
                                        onCheckedChange={(checked) => setIsDefaultReport(checked === true)}
                                        disabled={isFieldsLocked}
                                    />
                                    <label
                                        htmlFor="default-report"
                                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                                    >
                                        Configurar como informe por defecto
                                    </label>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Técnica de examen */}
                    <Card className="shadow-lg overflow-hidden  p-0">
                        <div
                            className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                            onClick={() => toggleSection('tecnica')}
                        >
                            <h3 className="text-white font-semibold">Técnica de examen</h3>
                            <div className="flex items-center gap-2">
                                {isFieldsLocked && (
                                    <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Campo bloqueado
                                    </span>
                                )}
                                {openSections.tecnica ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                        </div>

                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tecnica ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-2 py-1">
                                <div className={isFieldsLocked ? 'pointer-events-none opacity-60' : ''}>
                                    <RichTextEditor
                                        value={technique}
                                        onChange={setTechnique}
                                        placeholder="Escribe la técnica del examen..."
                                        onEditorReady={(editor) => editorsRef.current.technique = editor}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Hallazgos */}
                    <Card className="shadow-lg overflow-hidden  p-0">
                        <div
                            className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                            onClick={() => toggleSection('hallazgos')}
                        >
                            <h3 className="text-white font-semibold">Hallazgos</h3>
                            <div className="flex items-center gap-2">
                                {isFieldsLocked && (
                                    <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Campo bloqueado
                                    </span>
                                )}
                                {openSections.hallazgos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                        </div>

                        <div className={`transition-all  duration-300 ease-in-out overflow-hidden ${openSections.hallazgos ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-2 py-1">
                                <div className={isFieldsLocked ? 'pointer-events-none opacity-60' : ''}>
                                    <RichTextEditor
                                        value={findings}
                                        onChange={setFindings}
                                        placeholder="Escribe los hallazgos..."
                                        onEditorReady={(editor) => editorsRef.current.findings = editor}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Impresiones */}
                    <Card className="shadow-lg overflow-hidden  p-0">
                        <div
                            className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                            onClick={() => toggleSection('impresiones')}
                        >
                            <h3 className="text-white font-semibold">Impresiones</h3>
                            <div className="flex items-center gap-2">
                                {isFieldsLocked && (
                                    <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Campo bloqueado
                                    </span>
                                )}
                                {openSections.impresiones ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                        </div>

                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.impresiones ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-2 py-1">
                                <div className={isFieldsLocked ? 'pointer-events-none opacity-60' : ''}>
                                    <RichTextEditor
                                        value={impression}
                                        onChange={setImpression}
                                        placeholder="Escribe las impresiones..."
                                        onEditorReady={(editor) => editorsRef.current.impression = editor}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Conclusiones */}
                    <Card className="shadow-lg overflow-hidden  p-0">
                        <div
                            className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                            onClick={() => toggleSection('conclusiones')}
                        >
                            <h3 className="text-white font-semibold">Conclusiones</h3>
                            <div className="flex items-center gap-2">
                                {isFieldsLocked && (
                                    <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                                        </svg>
                                        Campo bloqueado
                                    </span>
                                )}
                                {openSections.conclusiones ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                        </div>

                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.conclusiones ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-2 py-1">
                                <div className={isFieldsLocked ? 'pointer-events-none opacity-60' : ''}>
                                    <RichTextEditor
                                        value={conclusion}
                                        onChange={setConclusion}
                                        placeholder="Escribe las conclusiones..."
                                        onEditorReady={(editor) => editorsRef.current.conclusion = editor}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};
