import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useInformeDetalle, useUpdateReport, useUnblockExam, useBlockExam } from "../hooks/use-informes";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ChevronDown, ChevronUp, FileMinus, Image as ImageIcon, Save, Signature, PanelLeftClose, PanelLeftOpen, PanelRightClose, Image, User, Loader2, X } from "lucide-react";
import { LayoutSinSidebar } from "@/layouts/LayoutSinSidebar";
import { useImagenesPorEstudio } from "@/hooks/use-global";
import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "sonner";
import { useTemplates } from "@/modules/redaccion/informe-predefinidos/hooks/use-templates";
import type { Template } from "@/modules/redaccion/informe-predefinidos/types/informe-pred.types";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useVerifyCredentials } from "./hooks/use-verify-credentials";
import { useSignReport } from "./hooks/use-sing-report";
import { useQuitarFirma } from "./hooks/use-quitar-firma";
import { useNextExam } from "./hooks/use-next-exam";
import { useQueryClient } from "@tanstack/react-query";
import { informesKeys } from "../constants/query-keys";
import { CloseTabModal, NextExamModal, SignModal, TemplateModal } from "../components/modals";
import { clearWindowStorage, notifyGuidChange } from "./hooks/use-cross-windows";

export const RedactarInforme = () => {
    const { informeGuid, studyInstanceUID } = useParams();
    const [searchParams] = useSearchParams();

    // Obtener los parámetros
    const modalityId = searchParams.get('modality_id');
    const bodypartId = searchParams.get('bodypart_id');
    const studyGroupId = searchParams.get('study_group_id');
    const windowId = searchParams.get('windowId'); // ID único de la ventana

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
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    // Hooks para plantillas
    const { data: templatesData } = useTemplates(studyTypeFilter || undefined);
    // En tu componente
    const { mutateAsync: verifyCredentials } = useVerifyCredentials();
    const { mutateAsync: signReport } = useSignReport();
    const { mutateAsync: quitarFirma } = useQuitarFirma();
    const { mutateAsync: getNextExam } = useNextExam();
    const { mutateAsync: unblockExam } = useUnblockExam();
    const { mutateAsync: blockExam } = useBlockExam();

    const queryClient = useQueryClient();
    const [isNextExamModalOpen, setIsNextExamModalOpen] = useState(false);
    const [nextExamData, setNextExamData] = useState<any>(null);
    const [isCloseTabModalOpen, setIsCloseTabModalOpen] = useState(false);
    const navigate = useNavigate();

    // Ref para mantener el informeGuid actual actualizado en el listener
    const currentInformeGuidRef = useRef(informeGuid);

    // Actualizar la ref cuando cambie el informeGuid
    useEffect(() => {
        currentInformeGuidRef.current = informeGuid;

        // Actualizar el localStorage con el GUID actual si tenemos windowId
        if (windowId && informeGuid) {
            const currentValue = localStorage.getItem(windowId);

            // Solo actualizar si cambió
            if (currentValue !== informeGuid) {
                localStorage.setItem(windowId, informeGuid);
                console.log('✅ useEffect - localStorage actualizado:', windowId, currentValue, '→', informeGuid);

                // También notificar a otras ventanas
                notifyGuidChange(windowId, informeGuid);
            }
        }
    }, [informeGuid, windowId]);

    useEffect(() => {
        if (!windowId) return;

        const checkStorage = () => {
            const currentValue = localStorage.getItem(windowId);
            console.log('🔍 localStorage actual:', windowId, '=', currentValue);
        };

        // Revisar cada segundo
        const interval = setInterval(checkStorage, 1000);

        return () => clearInterval(interval);
    }, [windowId]);

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
                techniques: informeDetalle.data ? informeDetalle.data.techniques || '' : '',
                findings: informeDetalle.data ? informeDetalle.data.findings || '' : '',
                impressions: informeDetalle.data ? informeDetalle.data.impressions || '' : '',
                conclusions: informeDetalle.data ? informeDetalle.data.conclusions || '' : ''
            });
            setIsSigned(informeDetalle.data.is_reported || false);
        }
    }, [informeDetalle?.data]);

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

    // Estados para controlar la visibilidad de los sidebars
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleChange = (field: string, value: string) => {
        const previousValue = formData[field as keyof typeof formData] || '';
        const parser = new DOMParser();
        const prevDoc = parser.parseFromString(previousValue, 'text/html');
        const newDoc = parser.parseFromString(value, 'text/html');
        const prevText = prevDoc.body.textContent || '';
        const newText = newDoc.body.textContent || '';
        const insertedText = newText.replace(prevText, '').toLowerCase().trim();

        const comandos = ['siguiente campo', 'próximo campo', 'next field'];
        const esComando = comandos.some(cmd => insertedText.includes(cmd));

        if (esComando) {
            console.log('🎤 Comando de voz detectado:', insertedText);
            if (findNextPlaceholderRef.current) {
                findNextPlaceholderRef.current();
            }
            setTimeout(() => {
                const editor = editorsRef.current[field as keyof typeof editorsRef.current];
                if (editor) {
                    editor.commands.setContent(previousValue);
                }
            }, 0);
            return;
        }

        setFormData(prev => ({ ...prev, [field]: value }));

        const imgElements = newDoc.querySelectorAll('img');
        const usedImageUrls = Array.from(imgElements).map(img => img.src);
        const currentImages = new Set(images.map(img => img.url));
        const missingImages = allImages.filter(img =>
            !usedImageUrls.includes(img.url) && !currentImages.has(img.url)
        );

        if (missingImages.length > 0) {
            setImages(prev => [...prev, ...missingImages]);
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
            editor.chain().focus().setImage({
                src: draggedImage.url,
                alt: draggedImage.name,
                title: draggedImage.name
            }).run();
            setImages(prev => prev.filter(img => img.id !== draggedImage.id));
        }
    };

    const handleEditorReady = useCallback((editor: any, fieldName: string) => {
        editorsRef.current[fieldName as keyof typeof editorsRef.current] = editor;
        editor.on('focus', () => {
            currentFieldRef.current = fieldName;
            console.log(`📝 Campo activo: ${fieldName}`);
        });
    }, []);

    const findNextPlaceholder = useCallback(() => {
        const fieldOrder: Array<keyof typeof editorsRef.current> = ['techniques', 'findings', 'impressions', 'conclusions'];

        // Encontrar el índice del campo actual
        let currentFieldIndex = fieldOrder.indexOf(currentFieldRef.current as keyof typeof editorsRef.current);
        if (currentFieldIndex === -1) currentFieldIndex = 0;

        // Obtener el editor actual y la posición del cursor
        const currentEditor = editorsRef.current[currentFieldRef.current as keyof typeof editorsRef.current];
        let currentCursorPos = 0;

        if (currentEditor && !currentEditor.isDestroyed) {
            // Obtener la posición actual del cursor
            const { from } = currentEditor.state.selection;
            currentCursorPos = from;
        }

        // Buscar en todos los campos empezando por el actual
        for (let i = 0; i < fieldOrder.length; i++) {
            const fieldIndex = (currentFieldIndex + i) % fieldOrder.length;
            const fieldName = fieldOrder[fieldIndex];
            const editor = editorsRef.current[fieldName];

            if (!editor) continue;

            const text = editor.getText();
            const regex = /\[\[([^\]]+)\]\]/g;
            let match;
            const matches = [];

            // Recopilar todos los matches con sus posiciones
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[1],
                    index: match.index,
                    fullMatch: match[0]
                });
            }

            if (matches.length === 0) continue;

            // Si estamos en el mismo campo, buscar desde la posición del cursor
            if (i === 0 && fieldName === currentFieldRef.current) {
                // Buscar el primer placeholder después de la posición del cursor
                const nextMatch = matches.find(m => m.index >= currentCursorPos);

                if (nextMatch) {
                    // Encontramos un placeholder después del cursor en el mismo campo
                    selectPlaceholder(editor, nextMatch, fieldName);
                    return true;
                }
                // Si no hay más placeholders después del cursor, continuar al siguiente campo
                continue;
            } else {
                // En campos diferentes, seleccionar el primer placeholder
                if (matches.length > 0) {
                    selectPlaceholder(editor, matches[0], fieldName);
                    return true;
                }
            }
        }

        // No se encontraron más placeholders
        lastPlaceholderIndexRef.current = -1;
        toast.info('No se encontraron más placeholders [[texto]]');
        return false;
    }, []);

    // Función auxiliar para seleccionar un placeholder
    const selectPlaceholder = (editor: any, match: { text: string; index: number }, fieldName: string) => {
        currentFieldRef.current = fieldName;

        const startPos = match.index + 2; // Después de [[
        const endPos = startPos + match.text.length;

        editor.commands.focus();

        setTimeout(() => {
            if (editor && !editor.isDestroyed) {
                editor.commands.setTextSelection({
                    from: startPos + 1,
                    to: endPos + 1
                });

                const editorElement = editor.view.dom;
                if (editorElement) {
                    editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 50);

        console.log(`✅ Placeholder encontrado: "${match.text}" en campo ${fieldName}`);
    };

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

    useEffect(() => {
        findNextPlaceholderRef.current = findNextPlaceholder;
    }, [findNextPlaceholder]);



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

    useEffect(() => {
        const handleVoiceCommand = (text: string) => {
            const lowerText = text.toLowerCase().trim();

            if (lowerText.includes('siguiente campo') ||
                lowerText.includes('próximo campo') ||
                lowerText.includes('next field')) {
                findNextPlaceholder();
                return true;
            }

            return false;
        };

        (window as any).handleVoiceCommand = handleVoiceCommand;
        (window as any).nextPlaceholder = findNextPlaceholder;

        return () => {
            delete (window as any).handleVoiceCommand;
            delete (window as any).nextPlaceholder;
        };
    }, [findNextPlaceholder]);

    const handleOpenPdf = () => {
        if (!informeGuid) {
            toast.error('No se encontró el ID del examen');
            return;
        }
        window.open(
            `http://148.230.72.8:5001/api/pdfs/${informeDetalle?.data?.pdf_path}`,
            '_blank',
        );
    };


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

    const handleVerifyCredentials = async () => {
        if (!password.trim()) {
            toast.error('Por favor ingrese su contraseña');
            return;
        }

        setIsSigning(true);

        try {
            // 1. Verificar credenciales
            await verifyCredentials({ password });

            // Si el informe ya está firmado, quitar la firma
            if (isSigned) {
                // Quitar firma del informe
                await quitarFirma({ examId: informeGuid || '' });

                // Bloquear el informe nuevamente porque sigue trabajando en él
                if (informeGuid) {
                    await blockExam(informeGuid);
                }

                // Actualizar estados locales
                setIsSigned(false);
                setIsSignModalOpen(false);
                setPassword('');

                // Invalidar cache
                queryClient.invalidateQueries({
                    queryKey: informesKeys.lists()
                });
            } else {
                // 2. Preparar payload para firmar
                const payload: Record<string, string> = {};

                if (modalityId && modalityId !== 'undefined') {
                    payload.modality_id = modalityId;
                }

                if (bodypartId && bodypartId !== 'undefined') {
                    payload.body_part_id = bodypartId;
                }

                if (studyGroupId && studyGroupId !== 'undefined') {
                    payload.study_group_id = studyGroupId;
                }

                // 3. Firmar reporte
                await signReport({
                    informeGuid: informeGuid || '',
                    ...payload
                });

                // 4. Obtener siguiente examen
                const nextExam = await getNextExam(payload);

                // 5. Actualizar estados locales
                setIsSigned(true);
                setIsSignModalOpen(false);
                setPassword('');

                // 6. Desbloquear el informe después de firmar
                if (informeGuid) {
                    await unblockExam(informeGuid);
                }

                // 7. Invalidar cache DESPUÉS del unblock para que se actualice
                queryClient.invalidateQueries({
                    queryKey: informesKeys.lists()
                });

                // 8. Si hay siguiente examen, mostrar modal
                if (nextExam?.data) {
                    setNextExamData(nextExam.data);
                    setIsNextExamModalOpen(true);
                    //setear localStorage

                } else {
                    // 9. Si NO hay siguiente examen, mostrar modal de cerrar pestaña
                    setIsCloseTabModalOpen(true);
                }
            }
        } catch (error) {
            console.error('Error en el proceso de firma:', error);
        } finally {
            setIsSigning(false);
        }
    };
    const handleCloseTab = () => {
        unblockExam(informeGuid || '').finally(() => {
            // Limpiar localStorage antes de cerrar
            if (windowId) {
                localStorage.removeItem(windowId);
            }
            window.close();
        });
        // redirigir a una página de confirmación o al dashboard
        setTimeout(() => {
            toast.info('Por favor cierra la pestaña manualmente');
        }, 100);
    };

    const handleStayOnPage = () => {
        setIsCloseTabModalOpen(false);
    };
    const handleOpenNextExam = async () => {
        if (nextExamData) {
            try {
                // 1. PRIMERO: Actualizar localStorage localmente
                if (windowId) {
                    localStorage.setItem(windowId, nextExamData.guid);
                    console.log('🔄 localStorage actualizado localmente:', windowId, '→', nextExamData.guid);
                }
                console.log(nextExamData)
                // 2. SEGUNDO: Notificar a todas las ventanas (incluyendo la padre)
                if (windowId) {
                    notifyGuidChange(windowId, nextExamData.guid);
                    console.log('📡 Notificación enviada via BroadcastChannel');
                }

                // 3. TERCERO: Esperar un momento para que se propague el mensaje
                await new Promise(resolve => setTimeout(resolve, 100));

                // 4. CUARTO: Bloquear el nuevo examen
                console.log('🔒 Bloqueando nuevo examen:', nextExamData.guid);
                await blockExam(nextExamData.guid);

                // 5. QUINTO: Construir la URL
                const params = new URLSearchParams();
                if (modalityId) params.set('modality_id', modalityId);
                if (bodypartId) params.set('bodypart_id', bodypartId);
                if (studyGroupId) params.set('study_group_id', studyGroupId);
                if (windowId) params.set('windowId', windowId);

                const newUrl = `/redaccion/radiologia/redactar-informe/${nextExamData.guid}/${nextExamData.study_instance_uid}?${params.toString()}`;


                // 6. SEXTO: Navegar
                navigate(newUrl);

                setIsNextExamModalOpen(false);
            } catch (error) {
                console.error('❌ Error al abrir siguiente examen:', error);
                toast.error('Error al abrir el siguiente examen');
            }
        }
    };

    const handleSkipNextExam = () => {
        setIsNextExamModalOpen(false);
        setNextExamData(null);
        toast.success('Informe firmado exitosamente');
    };

    // Función para cerrar la ventana de forma segura (desbloqueando primero)
    // Al cerrar la ventana
    const handleCloseWindow = async () => {
        if (currentInformeGuidRef.current) {
            try {
                await unblockExam(currentInformeGuidRef.current);
                queryClient.invalidateQueries({
                    queryKey: informesKeys.lists()
                });

                // Limpiar y notificar
                if (windowId) {
                    clearWindowStorage(windowId); // Usa la función helper
                }

                setTimeout(() => window.close(), 300);
            } catch (error) {
                console.error('Error al desbloquear:', error);
                if (windowId) {
                    clearWindowStorage(windowId);
                }
                window.close();
            }
        } else {
            if (windowId) {
                clearWindowStorage(windowId);
            }
            window.close();
        }
    };
    if (isLoading) {
        return <LayoutSinSidebar>
            <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin w-8 h-8 text-brand-purple" />
            </div>
        </LayoutSinSidebar>;
    }

    return (
        <LayoutSinSidebar>
            <div className="">
                {/* Header con botones de acción */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative bg-white rounded-xl p-4 shadow-md border-l-4 border-brand-purple flex items-center justify-between gap-4 w-full">
                        <div className="flex items-start gap-4">
                            <div className="bg-purple-100 rounded-full p-3 animate-in zoom-in duration-500">
                                <User className="w-7 h-7 text-brand-purple" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-800 mb-1 animate-in fade-in slide-in-from-left-3 duration-500 delay-100">
                                    {informeDetalle?.data?.patient_name || 'Carlos Fernández'}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide animate-in fade-in duration-500 delay-200">
                                        Número de Registro
                                    </span>
                                    <span className="text-sm font-bold text-brand-purple bg-purple-50 px-3 py-1 rounded-lg animate-in fade-in zoom-in-95 duration-500 delay-300">
                                        NR {informeDetalle?.data?.admission_number}
                                    </span>
                                    <span className="text-sm font-bold text-brand-purple bg-purple-50 px-3 py-1 rounded-lg animate-in fade-in zoom-in-95 duration-500 delay-500">
                                        {informeDetalle?.data?.sex === 'M' ? 'Masculino' : 'Femenino'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <PrimaryButton onClick={handleOpenPdf}>
                                <FileMinus />
                                PDF
                            </PrimaryButton>
                            <PrimaryButton
                                onClick={() => setIsSignModalOpen(true)}

                            >
                                <Signature />
                                {isSigned ? 'QUITAR FIRMA' : 'FIRMAR'}
                            </PrimaryButton>
                            <PrimaryButton
                                onClick={handleGuardarInforme}
                                disabled={updateReportMutation.isPending || isSigned}
                            >
                                <Save />
                                {updateReportMutation.isPending ? 'GUARDANDO...' : 'GUARDAR'}
                            </PrimaryButton>
                            <PrimaryButton
                                onClick={handleCloseWindow}
                            >
                                <X />
                                CERRAR
                            </PrimaryButton>

                        </div>
                    </div>

                </div>

                {/* Layout de tres columnas con sidebars colapsables */}
                <div className="relative">
                    <div className="flex gap-2 items-start">
                        {/* Columna izquierda */}
                        <div className={`space-y-6 self-start transition-all duration-700 ease-in-out ${leftSidebarOpen
                            ? 'w-[320px] opacity-100 translate-x-0'
                            : 'w-0 opacity-0 -translate-x-full overflow-hidden'
                            }`}>
                            <div className={`min-w-[320px] space-y-4 transition-opacity duration-700 ease-in-out ${leftSidebarOpen ? 'opacity-100' : 'opacity-0'
                                }`}>

                                {/* Datos del examen */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all  hover:-translate-y-1 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div
                                        className="cursor-pointer bg-brand-purple px-4 py-3 flex justify-between items-center"
                                        onClick={() => toggleSection('datosExamen')}
                                    >
                                        <h3 className="text-white font-semibold">Datos del examen</h3>
                                        {openSections.datosExamen ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                    </div>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.datosExamen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all  hover:-translate-y-1 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '100ms' }}>
                                    <div
                                        className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                        onClick={() => toggleSection('datosTecnicos')}
                                    >
                                        <h3 className="text-white font-semibold">Datos técnicos</h3>
                                        {openSections.datosTecnicos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                    </div>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.datosTecnicos ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-6">
                                            <label className="text-xs text-gray-600 font-medium">Stat</label>
                                            <p className="text-sm font-medium mt-1">A</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Informes predefinidos */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all  hover:-translate-y-1 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '200ms' }}>
                                    <div
                                        className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                        onClick={() => toggleSection('informesPredefinidos')}
                                    >
                                        <h3 className="text-white font-semibold">Informes predefinidos</h3>
                                        {openSections.informesPredefinidos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                    </div>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.informesPredefinidos ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all  hover:-translate-y-1 animate-in fade-in slide-in-from-left-4 duration-700" style={{ animationDelay: '300ms' }}>
                                    <div
                                        className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                        onClick={() => toggleSection('historiaClinicaSidebar')}
                                    >
                                        <h3 className="text-white font-semibold">Historia clínica</h3>
                                        {openSections.historiaClinicaSidebar ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                    </div>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.historiaClinicaSidebar ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-6">
                                            <Input value="sin info" disabled className="bg-gray-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botón toggle sidebar izquierdo */}
                        <div className="self-stretch">
                            {leftSidebarOpen ? (
                                <button
                                    onClick={() => setLeftSidebarOpen(false)}
                                    className="bg-blue-500 h-[calc(100vh-160px)] hover:bg-blue-600 hover:scale-100 text-white p-2 rounded-lg shadow-lg transition-all  animate-in fade-in zoom-in duration-500"
                                    title="Ocultar panel de información"
                                >
                                    <PanelLeftClose className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setLeftSidebarOpen(true)}
                                    className="h-[calc(100vh-160px)] bg-brand-purple hover:bg-purple-800 hover:scale-100 text-white p-2 rounded-lg shadow-lg transition-all  flex items-center justify-center animate-in fade-in zoom-in duration-500"
                                    title="Mostrar panel de información"
                                >
                                    <PanelLeftOpen className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Columna central */}
                        <div className="flex-1 space-y-4 p-5 transition-all  ease-in-out min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto h-[calc(100vh-160px)] animate-in fade-in zoom-in-95 duration-500">

                            {/* Historia Clínica */}
                            <div className="bg-white rounded-xl shadow-sm border border-red-300 overflow-hidden relative hover:shadow-md transition-all duration-300 hover:-translate-y-1">
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
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.historiaClinica ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
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
                            <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                <div
                                    className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                    onClick={() => toggleSection('tecnica')}
                                >
                                    <h3 className="text-white font-semibold">Técnica de examen</h3>
                                    {openSections.tecnica ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tecnica ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                            readOnly={isSigned}

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
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.hallazgos ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                            readOnly={isSigned}
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
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.impresiones ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-2 space-y-2">
                                        <RichTextEditor
                                            value={formData.impressions}
                                            onChange={(value) => handleChange('impressions', value)}
                                            placeholder="Impresiones del estudio... (Arrastra imágenes aquí)"
                                            dragOver={dragOverField === 'impressions'}
                                            onDragOver={(e) => handleDragOver(e, 'impressions')}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, 'impressions', editorsRef.current.impressions)}
                                            onEditorReady={(editor) => handleEditorReady(editor, 'impressions')}
                                            readOnly={isSigned}
                                        />
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
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.conclusiones ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-2 space-y-2">
                                        <RichTextEditor
                                            value={formData.conclusions}
                                            onChange={(value) => handleChange('conclusions', value)}
                                            placeholder="Conclusiones del estudio... (Arrastra imágenes aquí)"
                                            dragOver={dragOverField === 'conclusions'}
                                            onDragOver={(e) => handleDragOver(e, 'conclusions')}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, 'conclusions', editorsRef.current.conclusions)}
                                            onEditorReady={(editor) => handleEditorReady(editor, 'conclusions')}
                                            readOnly={isSigned}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botón toggle derecho con animación */}
                        <div className="self-stretch">
                            {rightSidebarOpen ? (
                                <button
                                    onClick={() => setRightSidebarOpen(false)}
                                    className="bg-blue-500 h-[calc(100vh-160px)] hover:bg-blue-600 hover:scale-100 text-white p-2 rounded-lg shadow-lg transition-all  animate-in fade-in zoom-in duration-500"
                                    title="Ocultar panel de imágenes"
                                >
                                    <PanelRightClose className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setRightSidebarOpen(true)}
                                    className="h-[calc(100vh-160px)] bg-brand-purple hover:bg-purple-800 hover:scale-100 text-white p-2 rounded-lg shadow-lg transition-all  flex items-center justify-center animate-in fade-in zoom-in duration-500"
                                    title="Mostrar panel de imágenes"
                                >
                                    <Image className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Columna derecha - Imágenes */}
                        <div className={`self-start space-y-4 transition-all duration-700 ease-in-out ${rightSidebarOpen
                            ? 'w-[320px] opacity-100'
                            : 'w-0 opacity-0 overflow-hidden'
                            }`}>
                            <div className={`min-w-[320px] transition-opacity duration-700 ease-in-out ${rightSidebarOpen ? 'opacity-100' : 'opacity-0'
                                }`}>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full animate-in fade-in slide-in-from-right-4 duration-700  hover:shadow-md transition-shadow">
                                    <div
                                        className="cursor-pointer bg-brand-purple px-4 py-3 flex items-center justify-between shrink-0  transition-colors duration-200"
                                        onClick={() => toggleSection('imagenes')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5 text-white" />
                                            <h3 className="text-white font-semibold whitespace-nowrap">Imágenes</h3>
                                        </div>
                                        <div className={`transition-transform duration-300 ${openSections.imagenes ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    {openSections.imagenes && (
                                        <div className="transition-all duration-300 ease-in-out flex-1 overflow-hidden">
                                            <div className="p-4 h-[calc(100vh-210px)] flex flex-col">
                                                <p className="text-xs text-gray-500 text-center mb-4 shrink-0">
                                                    Arrastra las imágenes a los campos de texto
                                                </p>
                                                <div className="max-h-[700px] overflow-y-auto space-y-4 pr-2">
                                                    {images.map((image, index) => (
                                                        <div
                                                            key={image.id}
                                                            draggable
                                                            onDragStart={() => handleDragStart(image)}
                                                            onDragEnd={handleDragEnd}
                                                            className={`cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${draggedImage?.id === image.id ? 'opacity-50 scale-95' : ''
                                                                }`}
                                                            style={{ animationDelay: `${index * 50}ms` }}
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
                </div>
            </div>

            {/* Modal de Firma */}
            <SignModal
                isOpen={isSignModalOpen}
                onClose={() => {
                    setIsSignModalOpen(false);
                    setPassword('');
                }}
                isSigned={isSigned}
                password={password}
                setPassword={setPassword}
                isSigning={isSigning}
                onVerifyCredentials={handleVerifyCredentials}
            />

            {/* Modal de Selección de Plantilla */}
            <TemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => {
                    setIsTemplateModalOpen(false);
                    setSearchTerm('');
                    setStudyTypeFilter('');
                }}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredTemplates={filteredTemplates}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                onAccept={() => {
                    if (selectedTemplate) {
                        const hasChanges = formData.techniques || formData.findings ||
                            formData.impressions || formData.conclusions;

                        if (hasChanges) {
                            setIsConfirmationModalOpen(true);
                        } else {
                            setFormData({
                                techniques: selectedTemplate.technique || '',
                                findings: selectedTemplate.findings || '',
                                impressions: selectedTemplate.impression || '',
                                conclusions: selectedTemplate.conclusion || ''
                            });
                            setIsTemplateModalOpen(false);
                            toast.success('Plantilla aplicada exitosamente');
                        }
                    } else {
                        toast.error('Por favor seleccione una plantilla');
                    }
                }}
            />

            {/* Modal de Confirmación */}
            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={() => setIsConfirmationModalOpen(false)}
                onConfirm={() => {
                    if (selectedTemplate) {
                        setFormData({
                            techniques: selectedTemplate.technique || '',
                            findings: selectedTemplate.findings || '',
                            impressions: selectedTemplate.impression || '',
                            conclusions: selectedTemplate.conclusion || ''
                        });
                        setIsConfirmationModalOpen(false);
                        setIsTemplateModalOpen(false);
                        toast.success('Plantilla aplicada exitosamente');
                    }
                }}
                title="Confirmar cambio de plantilla"
                message="Si cambia la plantilla, se perderán todos los cambios realizados en el informe. ¿Está seguro que desea continuar?"
                confirmText="Sí, cambiar plantilla"
                cancelText="No, mantener cambios"
                variant="warning"
            />

            <NextExamModal
                isOpen={isNextExamModalOpen}
                onClose={() => setIsNextExamModalOpen(false)}
                nextExamData={nextExamData}
                onOpenNextExam={handleOpenNextExam}
                onSkip={handleSkipNextExam}
            />


            {/* Modal de Cerrar Pestaña */}
            <CloseTabModal
                isOpen={isCloseTabModalOpen}
                onClose={() => setIsCloseTabModalOpen(false)}
                onCloseTab={handleCloseTab}
                onStay={handleStayOnPage}
            />
        </LayoutSinSidebar>
    )
}