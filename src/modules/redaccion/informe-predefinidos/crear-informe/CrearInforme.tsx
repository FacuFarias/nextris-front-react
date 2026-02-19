import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/layouts/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Save, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from "lucide-react";
import { useCreateTemplate, useUpdateTemplate, useTemplate } from "../hooks/use-templates";
import { usePlaceholderNavigation } from "../hooks/use-placeholder-navigation";
import { toast } from "sonner";
import { useTiposEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/tipos-estudio";
import { Autocomplete } from "@/components/autocomplete";

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

    // Hook para navegación de placeholders con F3
    const { editorsRef } = usePlaceholderNavigation(['technique', 'findings', 'impression', 'conclusion']);
    const { tiposEstudio } = useTiposEstudio();

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
        }
    }, [templateData, isEditMode]);

    // Estado para controlar qué secciones están abiertas/cerradas
    const [openSections, setOpenSections] = useState({
        tituloYTipo: true,
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
            }

            navigate('/redaccion/informes-predefinidos');
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
            <div className="p-4">
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
                            <h1 className="text-2xl font-semibold">
                                {isEditMode ? "Editar Informe Predefinido" : "Crear Informe Predefinido"}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="bg-white/20 border-white/30 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Izquierda */}
                    <div className="space-y-6 lg:col-span-1">{/* Título y tipo de estudio */}
                        <Card className="shadow-lg overflow-hidden p-0 dark:bg-[#2a2e32]">
                            <div
                                className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                                onClick={() => toggleSection('tituloYTipo')}
                            >
                                <h3 className="text-white font-semibold">Título y tipo de estudio</h3>
                                {openSections.tituloYTipo ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>

                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tituloYTipo ? 'max-h-[1000px] min-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                            </div>
                        </Card>
                    </div>

                    {/* Columna Derecha */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Técnica de examen */}
                        <Card className="shadow-lg overflow-hidden  p-0 dark:bg-[#2a2e32]">
                            <div
                                className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                                onClick={() => toggleSection('tecnica')}
                            >
                                <h3 className="text-white font-semibold">Técnica de examen</h3>
                                {openSections.tecnica ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>

                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tecnica ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-2 py-1">
                                    <RichTextEditor
                                        value={technique}
                                        onChange={setTechnique}
                                        placeholder="Escribe la técnica del examen..."
                                        onEditorReady={(editor) => editorsRef.current.technique = editor}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Hallazgos */}
                        <Card className="shadow-lg overflow-hidden  p-0 dark:bg-[#2a2e32]">
                            <div
                                className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                                onClick={() => toggleSection('hallazgos')}
                            >
                                <h3 className="text-white font-semibold">Hallazgos</h3>
                                {openSections.hallazgos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>

                            <div className={`transition-all  duration-300 ease-in-out overflow-hidden ${openSections.hallazgos ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-2 py-1">
                                    <RichTextEditor
                                        value={findings}
                                        onChange={setFindings}
                                        placeholder="Escribe los hallazgos..."
                                        onEditorReady={(editor) => editorsRef.current.findings = editor}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Impresiones */}
                        <Card className="shadow-lg overflow-hidden  p-0 dark:bg-[#2a2e32]">
                            <div
                                className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                                onClick={() => toggleSection('impresiones')}
                            >
                                <h3 className="text-white font-semibold">Impresiones</h3>
                                {openSections.impresiones ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>

                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.impresiones ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-2 py-1">
                                    <RichTextEditor
                                        value={impression}
                                        onChange={setImpression}
                                        placeholder="Escribe las impresiones..."
                                        onEditorReady={(editor) => editorsRef.current.impression = editor}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Conclusiones */}
                        <Card className="shadow-lg overflow-hidden  p-0 dark:bg-[#2a2e32]">
                            <div
                                className="bg-brand-purple px-4 py-3 cursor-pointer flex items-center justify-between"
                                onClick={() => toggleSection('conclusiones')}
                            >
                                <h3 className="text-white font-semibold">Conclusiones</h3>
                                {openSections.conclusiones ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>

                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.conclusiones ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-2 py-1">
                                    <RichTextEditor
                                        value={conclusion}
                                        onChange={setConclusion}
                                        placeholder="Escribe las conclusiones..."
                                        onEditorReady={(editor) => editorsRef.current.conclusion = editor}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
