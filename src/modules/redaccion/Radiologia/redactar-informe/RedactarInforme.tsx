import { useParams } from "react-router-dom"
import { useInformeDetalle, useUpdateReport } from "../hooks/use-informes";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ChevronDown, ChevronUp, FileMinus, Image as ImageIcon, Save, Signature, Lock, X, AlertCircle, Search, ShieldCheck } from "lucide-react";
import { LayoutSinSidebar } from "@/layouts/LayoutSinSidebar";
import { useImagenesPorEstudio } from "@/hooks/use-global";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Modal } from "@/components/Modal";
import { toast } from "sonner";
import { SecondaryButton } from "@/components";
import { api } from "@/lib/api";
import { useTemplates } from "@/modules/redaccion/informe-predefinidos/hooks/use-templates";
import type { Template } from "@/modules/redaccion/informe-predefinidos/types/informe-pred.types";

export const RedactarInforme = () => {

    const { informeGuid, studyInstanceUID } = useParams();
    /* const navigate = useNavigate(); */
    const { informeDetalle, isLoading } = useInformeDetalle(informeGuid);
    const { data: imagenes } = useImagenesPorEstudio(studyInstanceUID || '');
    const updateReportMutation = useUpdateReport(informeGuid || '');
    const [formData, setFormData] = useState({
        techniques: '',
        findings: '',
        impressions: '',
        conclusions: ''
    });
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [isSigned, setIsSigned] = useState(false);

    // Estados para el modal de plantillas
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [studyTypeFilter, setStudyTypeFilter] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    // Hooks para plantillas
    const { data: templatesData } = useTemplates(studyTypeFilter || undefined);


    // Filtrar plantillas por búsqueda local
    const filteredTemplates = templatesData?.data?.filter((template) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            template.title.toLowerCase().includes(searchLower) ||
            template.study_type_description?.toLowerCase().includes(searchLower)
        );
    }) || [];

    // Actualizar formData cuando informeDetalle cambie
    useEffect(() => {
        if (informeDetalle?.data) {
            setFormData({
                techniques: informeDetalle.data.techniques || '',
                findings: informeDetalle.data.findings || '',
                impressions: informeDetalle.data.impressions || '',
                conclusions: informeDetalle.data.conclusions || ''
            });
            // Verificar si el informe ya está firmado
            setIsSigned((informeDetalle.data as any).is_signed || false);
        }
    }, [informeDetalle]);

    // Estado para trackear el último índice de placeholder encontrado
    const lastPlaceholderIndexRef = useRef<number>(-1);
    const currentFieldRef = useRef<string>('');
    const findNextPlaceholderRef = useRef<(() => void) | null>(null);

    // Referencias a los editores usando useRef
    const editorsRef = useRef<{
        techniques: any;
        findings: any;
        impressions: any;
        conclusions: any;
    }>({
        techniques: null,
        findings: null,
        impressions: null,
        conclusions: null
    });

    // Estado para las imágenes disponibles
    const [images, setImages] = useState<Array<{ id: number; url: string; name: string }>>([]);
    // Estado para guardar todas las imágenes originales
    const [allImages, setAllImages] = useState<Array<{ id: number; url: string; name: string }>>([]);
    const [draggedImage, setDraggedImage] = useState<{ id: number; url: string; name: string } | null>(null);
    const [dragOverField, setDragOverField] = useState<string | null>(null);

    // Estado para controlar qué secciones están abiertas/cerradas
    const [openSections, setOpenSections] = useState({
        datosExamen: true,
        datosTecnicos: true,
        informesPredefinidos: true,
        historiaClinicaSidebar: true,
        historiaClinica: true,
        tecnica: true,
        hallazgos: true,
        impresiones: true,
        conclusiones: true,
        imagenes: true
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleChange = (field: string, value: string) => {
        // Obtener el valor anterior
        const previousValue = formData[field as keyof typeof formData] || '';

        // Detectar qué texto se está insertando (nuevo texto)
        const parser = new DOMParser();
        const prevDoc = parser.parseFromString(previousValue, 'text/html');
        const newDoc = parser.parseFromString(value, 'text/html');

        const prevText = prevDoc.body.textContent || '';
        const newText = newDoc.body.textContent || '';

        // Obtener solo el texto que se agregó
        const insertedText = newText.replace(prevText, '').toLowerCase().trim();

        // Detectar comandos de voz
        const comandos = [
            'siguiente campo',
            'próximo campo',
            'next field'
        ];

        const esComando = comandos.some(cmd => insertedText.includes(cmd));

        if (esComando) {
            // Es un comando, no insertar el texto, ejecutar la acción
            console.log('🎤 Comando de voz detectado:', insertedText);

            // Usar la referencia más reciente de la función
            if (findNextPlaceholderRef.current) {
                findNextPlaceholderRef.current();
            }

            // Revertir el cambio manteniendo el valor anterior
            // Necesitamos hacerlo en el próximo tick para que el editor se actualice
            setTimeout(() => {
                const editor = editorsRef.current[field as keyof typeof editorsRef.current];
                if (editor) {
                    editor.commands.setContent(previousValue);
                }
            }, 0);
            return;
        }

        // No es comando, procesar normalmente
        setFormData(prev => ({ ...prev, [field]: value }));

        // Extraer URLs de imágenes del contenido HTML
        const imgElements = newDoc.querySelectorAll('img');
        const usedImageUrls = Array.from(imgElements).map(img => img.src);

        // Restaurar imágenes que ya no están en el contenido
        const currentImages = new Set(images.map(img => img.url));
        const missingImages = allImages.filter(img =>
            !usedImageUrls.includes(img.url) && !currentImages.has(img.url)
        );

        if (missingImages.length > 0) {
            setImages(prev => [...prev, ...missingImages]);
            // Limpiar draggedImage si alguna de las imágenes restauradas coincide
            if (draggedImage && missingImages.some(img => img.id === draggedImage.id)) {
                setDraggedImage(null);
            }
        }
    };

    const handleDragStart = (image: { id: number; url: string; name: string }) => {
        setDraggedImage(image);
    };

    const handleDragEnd = () => {
        setDraggedImage(null);
        setDragOverField(null);
    };

    const handleDragOver = (e: React.DragEvent, field: string) => {
        e.preventDefault();
        setDragOverField(field);
    };

    const handleDragLeave = () => {
        setDragOverField(null);
    };

    const handleDrop = (e: React.DragEvent, _field: string, editor: any) => {
        e.preventDefault();
        if (draggedImage && editor) {
            // Insertar la imagen directamente en el editor
            editor.chain().focus().setImage({
                src: draggedImage.url,
                alt: draggedImage.name,
                title: draggedImage.name
            }).run();

            // Eliminar la imagen de la lista disponible
            setImages(prev => prev.filter(img => img.id !== draggedImage.id));
        }
    };

    // Callbacks para manejar los editores sin causar re-renders
    const handleEditorReady = useCallback((editor: any, fieldName: string) => {
        editorsRef.current[fieldName as keyof typeof editorsRef.current] = editor;

        // Agregar listener de focus para actualizar el campo actual
        editor.on('focus', () => {
            currentFieldRef.current = fieldName;
            console.log(`📝 Campo activo: ${fieldName}`);
        });

    }, []);

    // Función para buscar y seleccionar el siguiente placeholder [[texto]]
    const findNextPlaceholder = useCallback(() => {
        // Orden de los campos para buscar
        const fieldOrder: Array<keyof typeof editorsRef.current> = ['techniques', 'findings', 'impressions', 'conclusions'];

        // Encontrar el índice del campo actual
        let currentFieldIndex = fieldOrder.indexOf(currentFieldRef.current as keyof typeof editorsRef.current);
        if (currentFieldIndex === -1) currentFieldIndex = 0;

        // Buscar en todos los campos empezando por el actual
        for (let i = 0; i < fieldOrder.length; i++) {
            const fieldIndex = (currentFieldIndex + i) % fieldOrder.length;
            const fieldName = fieldOrder[fieldIndex];
            const editor = editorsRef.current[fieldName];

            if (!editor) continue;

            // Obtener el texto directo del editor (no del formData)
            const text = editor.getText();
            const regex = /\[\[([^\]]+)\]\]/g;
            const matches = Array.from(text.matchAll(regex));

            if (matches.length === 0) continue;

            // Determinar qué placeholder seleccionar
            let targetIndex = 0;

            // Si estamos en el mismo campo que la última vez
            if (fieldName === currentFieldRef.current && i === 0) {
                // Ir al siguiente placeholder
                targetIndex = (lastPlaceholderIndexRef.current + 1) % matches.length;
            } else {
                // Si es un campo diferente o es la primera vez, empezar desde el principio
                targetIndex = 0;
            }

            const match = matches[targetIndex] as RegExpMatchArray;
            if (!match || match.index === undefined) continue;

            // Actualizar referencias
            currentFieldRef.current = fieldName;
            lastPlaceholderIndexRef.current = targetIndex;

            // Calcular posiciones en el documento del editor
            // La posición del texto dentro de [[ ]]
            const startPos = match.index + 2; // Después de [[
            const endPos = startPos + match[1].length; // Final del texto

            // Hacer el focus y selección en pasos separados
            editor.commands.focus();

            // Usar setTimeout para asegurar que el focus se aplique primero
            setTimeout(() => {
                if (editor && !editor.isDestroyed) {
                    editor.commands.setTextSelection({
                        from: startPos + 1, // TipTap usa posiciones 1-based
                        to: endPos + 1
                    });

                    // Scroll al elemento si es necesario
                    const editorElement = editor.view.dom;
                    if (editorElement) {
                        editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 50); // Aumentar timeout para dar tiempo al focus

            console.log(`✅ Placeholder encontrado: "${match[1]}" en campo ${fieldName}`);
            return true;
        }

        // Si no se encontró ningún placeholder, reiniciar la búsqueda
        lastPlaceholderIndexRef.current = -1;
        toast.info('No se encontraron más placeholders [[texto]]');
        return false;
    }, []);


    useEffect(() => {
        if (imagenes?.images && imagenes.images.length > 0) {
            const formattedImages = imagenes.images.map((img, index) => ({
                id: index + 1,
                url: img.path,
                name: img.filename
            }));
            setImages(formattedImages);
            setAllImages(formattedImages);
        }
    }, [imagenes]);

    // Actualizar la referencia cuando cambia la función
    useEffect(() => {
        findNextPlaceholderRef.current = findNextPlaceholder;
    }, [findNextPlaceholder]);

    // Listener para detectar F3
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F3') {
                e.preventDefault();
                findNextPlaceholder();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [findNextPlaceholder]);

    // Sistema de detección de comandos de voz
    useEffect(() => {
        const handleVoiceCommand = (text: string) => {
            const lowerText = text.toLowerCase().trim();

            // Detectar comando "siguiente campo"
            if (lowerText.includes('siguiente campo') ||
                lowerText.includes('próximo campo') ||
                lowerText.includes('next field')) {
                findNextPlaceholder();
                return true;
            }

            return false;
        };

        // Exponer función globalmente para que el sistema de transcripción pueda llamarla
        (window as any).handleVoiceCommand = handleVoiceCommand;
        (window as any).nextPlaceholder = findNextPlaceholder;

        return () => {
            delete (window as any).handleVoiceCommand;
            delete (window as any).nextPlaceholder;
        };
    }, [findNextPlaceholder]);

    // Función para guardar el informe
    const handleGuardarInforme = () => {
        if (!informeGuid) {
            toast.error('No se encontró el ID del examen');
            return;
        }

        const dataToSave = {
            techniques: formData.techniques,
            findings: formData.findings,
            impressions: formData.impressions,
            conclusions: formData.conclusions,
            mark_as_reported: false
        };

        updateReportMutation.mutate(dataToSave);
    };
    if (isLoading) {
        return <LayoutSinSidebar>Cargando...</LayoutSinSidebar>;
    }

    return (
        <LayoutSinSidebar>
            <div className="">
                {/* Header con botones de acción */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {informeDetalle?.data?.patient_name || 'Carlos Fernández'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            NR{informeDetalle?.data?.admission_number}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <PrimaryButton >
                            <FileMinus />
                            PDF
                        </PrimaryButton>
                        <PrimaryButton onClick={() => setIsSignModalOpen(true)} disabled={isSigned}>
                            <Signature />
                            {isSigned ? 'FIRMADO' : 'FIRMAR'}
                        </PrimaryButton>
                        <PrimaryButton
                            onClick={handleGuardarInforme}
                            disabled={updateReportMutation.isPending || isSigned}
                        >
                            <Save />
                            {updateReportMutation.isPending ? 'GUARDANDO...' : 'GUARDAR'}
                        </PrimaryButton>
                    </div>
                </div>

                {/* Layout de tres columnas */}
                <div className={`grid grid-cols-1 gap-6 items-start transition-all duration-300 ${openSections.imagenes ? 'lg:grid-cols-[320px_1fr_320px]' : 'lg:grid-cols-[320px_1fr_auto]'}`}>
                    {/* Columna izquierda */}
                    <div className="space-y-4 self-start sticky top-6">
                        {/* Datos del examen */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-4 py-3 flex justify-between items-center"
                                onClick={() => toggleSection('datosExamen')}
                            >
                                <h3 className="text-white font-semibold">Datos del examen</h3>
                                {openSections.datosExamen ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.datosExamen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Estudio</label>
                                        <p className="text-sm font-medium mt-1">ANGIOTOMOGRAFÍA PELVIANA O VASOS ILÍACOS</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-600 font-medium">Fecha</label>
                                            <p className="text-sm font-medium mt-1">13/12/2025</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 font-medium">Modalidad</label>
                                            <p className="text-sm font-medium mt-1">CT</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Médico Referente</label>
                                        <p className="text-sm font-medium mt-1">-</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Datos técnicos */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('datosTecnicos')}
                            >
                                <h3 className="text-white font-semibold">Datos técnicos</h3>
                                {openSections.datosTecnicos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.datosTecnicos ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-6">
                                    <label className="text-xs text-gray-600 font-medium">Stat</label>
                                    <p className="text-sm font-medium mt-1">A</p>
                                </div>
                            </div>
                        </div>

                        {/* Informes predefinidos */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('informesPredefinidos')}
                            >
                                <h3 className="text-white font-semibold">Informes predefinidos</h3>
                                {openSections.informesPredefinidos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.informesPredefinidos ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-6">
                                    <label className="text-xs text-gray-600 font-medium">Predef Seleccionado</label>
                                    <p className="text-sm font-medium mt-1 text-purple-400">
                                        {selectedTemplate?.title || 'Ninguna plantilla seleccionada'}
                                    </p>
                                    <button
                                        className="text-purple-600 text-sm mt-3 hover:underline"
                                        onClick={() => setIsTemplateModalOpen(true)}
                                    >
                                        Cambiar plantilla
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Historia clínica */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('historiaClinicaSidebar')}
                            >
                                <h3 className="text-white font-semibold">Historia clínica</h3>
                                {openSections.historiaClinicaSidebar ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.historiaClinicaSidebar ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-6">
                                    <Input value="sin info" disabled className="bg-gray-50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna central */}
                    <div className="space-y-4">
                        {/* Historia Clínica */}
                        <div className="bg-white rounded-xl shadow-sm border border-red-300 overflow-hidden relative">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('historiaClinica')}
                            >
                                <div className="flex items-center gap-3">
                                    <h3 className="text-white font-semibold">Historia Clínica</h3>
                                    <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                        🔒 Campo Bloqueado
                                    </span>
                                </div>
                                {openSections.historiaClinica ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.historiaClinica ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2">
                                    <textarea
                                        className="w-full h-20 p-3 border-2 border-red-200 rounded-md bg-red-50 text-gray-500 resize-none cursor-not-allowed"
                                        placeholder="Historia clínica escrita por el técnico..."
                                        disabled
                                        value={informeDetalle?.data?.history}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Técnica de examen */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('tecnica')}
                            >
                                <h3 className="text-white font-semibold">Técnica de examen</h3>
                                {openSections.tecnica ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tecnica ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2 space-y-2">
                                    <RichTextEditor
                                        value={formData.techniques}
                                        onChange={(value) => handleChange('techniques', value)}
                                        placeholder="Descripción de la técnica utilizada... (Arrastra imágenes aquí)"
                                        dragOver={dragOverField === 'techniques'}
                                        onDragOver={(e) => handleDragOver(e, 'techniques')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'techniques', editorsRef.current.techniques)}
                                        onEditorReady={(editor) => handleEditorReady(editor, 'techniques')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hallazgos */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('hallazgos')}
                            >
                                <h3 className="text-white font-semibold">Hallazgos</h3>
                                {openSections.hallazgos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.hallazgos ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2 space-y-2">
                                    <RichTextEditor
                                        value={formData.findings}
                                        onChange={(value) => handleChange('findings', value)}
                                        placeholder="Descripción de hallazgos... (Arrastra imágenes aquí)"
                                        dragOver={dragOverField === 'findings'}
                                        onDragOver={(e) => handleDragOver(e, 'findings')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'findings', editorsRef.current.findings)}
                                        onEditorReady={(editor) => handleEditorReady(editor, 'findings')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Impresiones */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('impresiones')}
                            >
                                <h3 className="text-white font-semibold">Impresiones</h3>
                                {openSections.impresiones ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.impresiones ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2 space-y-2">
                                    <RichTextEditor
                                        value={formData.impressions}
                                        onChange={(value) => handleChange('impressions', value)}
                                        placeholder="Impresiones del estudio... (Arrastra imágenes aquí)"
                                        dragOver={dragOverField === 'impressions'}
                                        onDragOver={(e) => handleDragOver(e, 'impressions')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'impressions', editorsRef.current.impressions)}
                                        onEditorReady={(editor) => handleEditorReady(editor, 'impressions')} />
                                </div>
                            </div>
                        </div>

                        {/* Conclusiones */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('conclusiones')}
                            >
                                <h3 className="text-white font-semibold">Conclusiones</h3>
                                {openSections.conclusiones ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.conclusiones ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2 space-y-2">
                                    <RichTextEditor
                                        value={formData.conclusions}
                                        onChange={(value) => handleChange('conclusions', value)}
                                        placeholder="Conclusiones del estudio... (Arrastra imágenes aquí)"
                                        dragOver={dragOverField === 'conclusions'}
                                        onDragOver={(e) => handleDragOver(e, 'conclusions')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'conclusions', editorsRef.current.conclusions)}
                                        onEditorReady={(editor) => handleEditorReady(editor, 'conclusions')} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha - Imágenes */}
                    <div className={`self-start sticky top-6 ${openSections.imagenes ? 'space-y-4' : ''}`}>
                        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${openSections.imagenes ? '' : 'h-fit'}`}>
                            <div
                                className={`cursor-pointer bg-brand-purple flex items-center ${openSections.imagenes
                                    ? 'px-4 py-3 justify-between'
                                    : 'px-2 py-6 justify-center writing-mode-vertical'
                                    }`}
                                onClick={() => toggleSection('imagenes')}
                            >
                                {openSections.imagenes ? (
                                    <>
                                        <div className="flex items-center gap-2 animate-accordion-up">
                                            <ImageIcon className="w-5 h-5 text-white" />
                                            <h3 className="text-white font-semibold whitespace-nowrap">Imágenes</h3>
                                        </div>
                                        <ChevronUp className="w-5 h-5 text-white" />
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 animate-accordion-down" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                        <h3 className="text-white font-semibold whitespace-nowrap">Imágenes</h3>
                                        <ImageIcon className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>
                            {openSections.imagenes && (
                                <div className="transition-all duration-300 ease-in-out">
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 text-center mb-4">
                                            Arrastra las imágenes a los campos de texto
                                        </p>
                                        <div className="max-h-[700px] overflow-y-auto space-y-4 pr-2">
                                            {images.map((image) => (
                                                <div
                                                    key={image.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(image)}
                                                    onDragEnd={handleDragEnd}
                                                    className={`cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all ${draggedImage?.id === image.id ? 'opacity-50 scale-95' : ''
                                                        }`}
                                                >
                                                    <img
                                                        src={image.url}
                                                        alt={image.name}
                                                        className="w-full h-auto object-cover"
                                                    />
                                                    <div className="p-2 bg-gray-50 text-center">
                                                        <p className="text-sm font-medium text-gray-700">{image.name}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Firma */}
            <Modal
                isOpen={isSignModalOpen}
                onClose={() => {
                    setIsSignModalOpen(false);
                    setPassword('');
                }}
                title="Firmar Informe"
                size="md"
            >
                <div className="space-y-6">


                    {/* Alerta informativa */}
                    <div className="bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">
                                Atención:
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                Esta acción requiere verificación de su identidad mediante contraseña.
                            </p>
                        </div>
                    </div>

                    {/* Input de contraseña */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Lock className="h-4 w-4 text-gray-500" />
                            Contraseña
                        </label>
                        <div className="relative">
                            <Input
                                type="password"
                                placeholder="Ingrese su contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-12 text-base border-gray-300 focus:border-brand-purple focus:ring-brand-purple"
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && password.trim() && !isSigning) {
                                        if (!password.trim()) {
                                            toast.error('Por favor ingrese su contraseña');
                                            return;
                                        }

                                        setIsSigning(true);

                                        try {
                                            // 1. Verificar credenciales
                                            await api.post('/verify-credentials', {
                                                password: password
                                            });

                                            // 2. Si las credenciales son correctas, firmar el informe
                                            await api.post(`/reports/${informeGuid}/sign`);

                                            // 3. Actualizar estado
                                            setIsSigned(true);
                                            setIsSignModalOpen(false);
                                            setPassword('');
                                            toast.success('Informe firmado exitosamente');
                                        } catch (error: any) {
                                            if (error.response?.status === 401 || error.response?.status === 403) {
                                                toast.error('Contraseña incorrecta');
                                            } else {
                                                toast.error('Error al firmar el informe');
                                            }
                                            console.error('Error al firmar:', error);
                                        } finally {
                                            setIsSigning(false);
                                        }
                                    }
                                }}
                                autoFocus
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-2 justify-end">
                        <SecondaryButton
                            onClick={() => {
                                setIsSignModalOpen(false);
                                setPassword('');
                            }}
                        >
                            <X className="h-5 w-5 mr-2" />
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={async () => {
                                if (!password.trim()) {
                                    toast.error('Por favor ingrese su contraseña');
                                    return;
                                }

                                setIsSigning(true);

                                try {
                                    // 1. Verificar credenciales
                                    await api.post('/verify-credentials', {
                                        password: password
                                    });

                                    // 2. Si las credenciales son correctas, firmar el informe
                                    await api.post(`/reports/${informeGuid}/sign`);

                                    // 3. Actualizar estado
                                    setIsSigned(true);
                                    setIsSignModalOpen(false);
                                    setPassword('');
                                    toast.success('Informe firmado exitosamente');
                                } catch (error: any) {
                                    if (error.response?.status === 401 || error.response?.status === 403) {
                                        toast.error('Contraseña incorrecta');
                                    } else {
                                        toast.error('Error al firmar el informe');
                                    }
                                    console.error('Error al firmar:', error);
                                } finally {
                                    setIsSigning(false);
                                }
                            }}
                            disabled={!password.trim() || isSigning}
                        >
                            <Signature className="h-5 w-5 mr-2" />
                            {isSigning ? 'Firmando...' : 'Confirmar y Firmar'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Modal de Selección de Plantilla */}
            <Modal
                isOpen={isTemplateModalOpen}
                onClose={() => {
                    setIsTemplateModalOpen(false);
                    setSearchTerm('');
                    setStudyTypeFilter('');
                }}
                title="Seleccionar informe predefinido"
                size="xxl"
            >
                <div className="space-y-4">
                    {/* Filtros */}
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Buscar por tipo de estudio..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="w-64">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <input
                                    type="checkbox"
                                    className="rounded"
                                />
                                Mi tipo de estudio
                            </label>
                        </div>
                    </div>

                    {/* Lista de plantillas */}
                    <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                        {filteredTemplates.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No se encontraron plantillas
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredTemplates.map((template) => (
                                    <div
                                        key={template.guid}
                                        className={`p-4 cursor-pointer transition-all grid grid-cols-2 gap-4 relative ${selectedTemplate?.guid === template.guid
                                            ? 'bg-purple-100 border-2 border-brand-purple shadow-md'
                                            : 'hover:bg-gray-50 border-2 border-transparent'
                                            }`}
                                        onClick={() => setSelectedTemplate(template)}
                                    >
                                        {selectedTemplate?.guid === template.guid && (
                                            <div className="absolute top-2 right-2 bg-brand-purple text-white rounded-full p-1">
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>
                                        )}
                                        <div className={`font-medium ${selectedTemplate?.guid === template.guid ? 'text-brand-purple' : 'text-gray-700'}`}>
                                            {template.title}
                                        </div>
                                        <div className={`font-medium ${selectedTemplate?.guid === template.guid ? 'text-brand-purple' : 'text-gray-700'}`}>
                                            {template.title}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-2 justify-end">
                        <SecondaryButton
                            onClick={() => {
                                setIsTemplateModalOpen(false);
                                setSearchTerm('');
                                setStudyTypeFilter('');
                            }}
                        >
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={() => {
                                if (selectedTemplate) {
                                    // Reemplazar todos los campos del formulario
                                    setFormData({
                                        techniques: selectedTemplate.technique || '',
                                        findings: selectedTemplate.findings || '',
                                        impressions: selectedTemplate.impression || '',
                                        conclusions: selectedTemplate.conclusion || ''
                                    });
                                    setIsTemplateModalOpen(false);
                                    toast.success('Plantilla aplicada exitosamente');
                                } else {
                                    toast.error('Por favor seleccione una plantilla');
                                }
                            }}
                            disabled={!selectedTemplate}
                        >
                            ACEPTAR
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </LayoutSinSidebar>
    )
}
