import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useAllTags, useInformeDetalle, useUpdateFlags, useUpdateReport, useUpdateTagIds, useUnblockExam, useBlockExam, usePatientHistory } from "../hooks/use-informes";
import { useState, useEffect, useRef, useCallback } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ChevronDown, ChevronUp, FileMinus, Image as ImageIcon, Save, Signature, User, Loader2, X, Sparkles, FileText, Bold, Italic, Underline as UnderlineIcon, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, FileIcon } from "lucide-react";
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
import { clearWindowStorage, notifyGuidChange, notifyViewerUpdate } from "./hooks/use-cross-windows";
import { FlagsCell } from "../components/FlagsCell";
import { TagsCell } from "../components/TagsCell";

export const RedactarInforme = () => {
    const { informeGuid, studyInstanceUID } = useParams();
    const [searchParams] = useSearchParams();

    // Obtener los parámetros
    const modalityId = searchParams.get('modality_id');
    const bodypartId = searchParams.get('bodypart_id');
    const studyGroupId = searchParams.get('study_group_id');
    const windowId = searchParams.get('windowId');
    const siguientePaso = searchParams.get('siguiente_paso');
    const flagsParam = searchParams.get('flags');
    const tagIdsParam = searchParams.get('tag_ids');

    const initialFlagsFromParams = flagsParam
        ? flagsParam.split(',').map((value) => value.trim()).filter(Boolean)
        : [];
    const initialTagIdsFromParams = tagIdsParam
        ? tagIdsParam.split(',').map((value) => value.trim()).filter(Boolean)
        : [];

    const { informeDetalle, isLoading } = useInformeDetalle(informeGuid);
    const { data: imagenes } = useImagenesPorEstudio(studyInstanceUID || '');
    const updateReportMutation = useUpdateReport(informeGuid || '');
    const { mutate: updateFlags, isPending: isUpdatingFlags } = useUpdateFlags();
    const { mutate: updateTagIds, isPending: isUpdatingTagIds } = useUpdateTagIds();
    const { allTags } = useAllTags();
    const [formData, setFormData] = useState({
        history: '',
        techniques: '',
        findings: '',
        impressions: '',
        conclusions: ''
    });
    const [examFlags, setExamFlags] = useState<string[]>(initialFlagsFromParams);
    const [examTagIds, setExamTagIds] = useState<string[]>(initialTagIdsFromParams);
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

                // También notificar a otras ventanas
                notifyGuidChange(windowId, informeGuid);
            }
        }
    }, [informeGuid, windowId]);



    // Filtrar plantillas por búsqueda local
    const filteredTemplates = templatesData?.data?.filter((template) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            template.title.toLowerCase().includes(searchLower) ||
            template.study_type_description?.toLowerCase().includes(searchLower)
        );
    }) || [];

    const getExamMetaFromCachedLists = useCallback(() => {
        const cachedQueries = queryClient.getQueriesData({ queryKey: informesKeys.lists() });

        for (const [, data] of cachedQueries) {
            const rows = (data as any)?.data?.data;
            if (!Array.isArray(rows)) continue;

            const exam = rows.find((item: any) => item?.guid === informeGuid);
            if (exam) {
                return {
                    flags: Array.isArray(exam.flags) ? exam.flags : [],
                    tag_ids: Array.isArray(exam.tag_ids) ? exam.tag_ids : [],
                };
            }
        }

        return null;
    }, [informeGuid, queryClient]);

    // Actualizar formData cuando informeDetalle cambie
    useEffect(() => {
        if (informeDetalle?.data) {
            const cachedExamMeta = getExamMetaFromCachedLists();

            setFormData({
                history: informeDetalle.data.history || '',
                techniques: informeDetalle.data.techniques || '',
                findings: informeDetalle.data.findings || '',
                impressions: informeDetalle.data.impressions || '',
                conclusions: informeDetalle.data.conclusions || ''
            });
            setExamFlags((prev) => {
                if (Array.isArray(informeDetalle.data.flags)) return informeDetalle.data.flags;
                if (cachedExamMeta) return cachedExamMeta.flags;
                return prev;
            });
            setExamTagIds((prev) => {
                if (Array.isArray(informeDetalle.data.tag_ids)) return informeDetalle.data.tag_ids;
                if (cachedExamMeta) return cachedExamMeta.tag_ids;
                return prev;
            });
            setIsSigned(informeDetalle.data.is_reported || false);
        }
    }, [getExamMetaFromCachedLists, informeDetalle?.data]);

    useEffect(() => {
        if (initialFlagsFromParams.length > 0) {
            setExamFlags(initialFlagsFromParams);
        }
        if (initialTagIdsFromParams.length > 0) {
            setExamTagIds(initialTagIdsFromParams);
        }
    }, [flagsParam, tagIdsParam]);

    const patientId = informeDetalle?.data?.patient_id;
    const { historyData } = usePatientHistory(patientId);
    const patientStudies = historyData?.data || [];

    const [historyPdfUrl, setHistoryPdfUrl] = useState<string | null>(null);

    const handleOpenHistoryPdf = (pdfPath: string) => {
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        setHistoryPdfUrl(`${baseURL}/pdfs/${pdfPath}`);
    };

    const examId = informeDetalle?.data?.exam_id || informeGuid || '';

    const handleUpdateExamFlags = useCallback((_examId: string, flags: string[]) => {
        if (!examId) return;
        const previousFlags = examFlags;
        setExamFlags(flags);
        updateFlags(
            { examId, flags },
            {
                onError: () => setExamFlags(previousFlags),
            }
        );
    }, [examId, examFlags, updateFlags]);

    const handleUpdateExamTags = useCallback((_examId: string, tagIds: string[]) => {
        if (!examId) return;
        const previousTagIds = examTagIds;
        setExamTagIds(tagIds);
        updateTagIds(
            { examId, tagIds },
            {
                onError: () => setExamTagIds(previousTagIds),
            }
        );
    }, [examId, examTagIds, updateTagIds]);

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
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [rightSidebarTab, setRightSidebarTab] = useState<'history' | 'images' | 'ai'>('history');
    const [rightSidebarWidth, setRightSidebarWidth] = useState(380);
    const [isResizingRightSidebar, setIsResizingRightSidebar] = useState(false);
    const [activeEditorField, setActiveEditorField] = useState<keyof typeof editorsRef.current | null>(null);
    const rightSidebarResizeStartXRef = useRef(0);
    const rightSidebarResizeStartWidthRef = useRef(380);

    const getApiOrigin = useCallback(() => {
        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL;
            if (!apiBaseUrl) return window.location.origin;
            return new URL(apiBaseUrl, window.location.origin).origin;
        } catch {
            return window.location.origin;
        }
    }, []);

    const getImageUrlByFilename = useCallback((filename: string) => {
        const safeStudyUID = encodeURIComponent(studyInstanceUID || '');
        const safeFilename = encodeURIComponent(filename || '');
        return `${getApiOrigin()}/api/images/study/${safeStudyUID}/file/${safeFilename}`;
    }, [getApiOrigin, studyInstanceUID]);

    const resolveImageUrl = useCallback((rawPath: string | undefined, filename: string) => {
        const fallbackUrl = getImageUrlByFilename(filename);
        if (!rawPath) return fallbackUrl;

        if (rawPath.startsWith('data:image/')) return rawPath;

        if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
            try {
                const parsed = new URL(rawPath);
                if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
                    parsed.protocol = 'https:';
                }
                return parsed.toString();
            } catch {
                return fallbackUrl;
            }
        }

        if (rawPath.startsWith('/api/')) {
            return `${getApiOrigin()}${rawPath}`;
        }

        if (rawPath.startsWith('api/')) {
            return `${getApiOrigin()}/${rawPath}`;
        }

        if (rawPath.startsWith('/uploads') || rawPath.startsWith('/media')) {
            return `${getApiOrigin()}${rawPath}`;
        }

        return fallbackUrl;
    }, [getApiOrigin, getImageUrlByFilename]);

    const getImageMimeType = useCallback((filename: string) => {
        const lower = filename.toLowerCase();
        if (lower.endsWith('.png')) return 'image/png';
        if (lower.endsWith('.webp')) return 'image/webp';
        return 'image/jpeg';
    }, []);

    const rightSidebarTabLabel = rightSidebarTab === 'history'
            ? 'Historia clínica'
            : rightSidebarTab === 'images'
                ? 'Imágenes clave'
                : 'Asistencia IA';
    const RightSidebarTabIcon = rightSidebarTab === 'history'
            ? FileText
            : rightSidebarTab === 'images'
                ? ImageIcon
                : Sparkles;

    const handleRightSidebarResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        rightSidebarResizeStartXRef.current = e.clientX;
        rightSidebarResizeStartWidthRef.current = rightSidebarWidth;
        setIsResizingRightSidebar(true);
    };

    useEffect(() => {
        if (!isResizingRightSidebar) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = rightSidebarResizeStartXRef.current - e.clientX;
            const nextWidth = Math.max(320, Math.min(560, rightSidebarResizeStartWidthRef.current + delta));
            setRightSidebarWidth(nextWidth);
        };

        const handleMouseUp = () => {
            setIsResizingRightSidebar(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizingRightSidebar]);

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
        const field = fieldName as keyof typeof editorsRef.current;
        editorsRef.current[field] = editor;
        if (!currentFieldRef.current) {
            currentFieldRef.current = fieldName;
            setActiveEditorField(field);
        }
        editor.on('focus', () => {
            currentFieldRef.current = fieldName;
            setActiveEditorField(field);
            console.log(`📝 Campo activo: ${fieldName}`);
        });
    }, []);

    const activeEditor = activeEditorField ? editorsRef.current[activeEditorField] : null;

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

    };

    useEffect(() => {
        if (imagenes?.images && imagenes.images.length > 0) {
            const formattedImages = imagenes.images.map((img, index) => {
                const imageData = typeof img.data === 'string' ? img.data : '';
                const imageUrl = imageData
                    ? `data:${getImageMimeType(img.filename)};base64,${imageData}`
                    : resolveImageUrl(img.path, img.filename);

                return {
                id: index + 1,
                url: imageUrl,
                name: img.filename
                };
            });
            setImages(formattedImages);
            setAllImages(formattedImages);
        }
    }, [getImageMimeType, imagenes, resolveImageUrl]);

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
            history: formData.history,
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

                // 8. Si hay siguiente examen Y siguientePaso está activado, mostrar modal
                if (nextExam?.data && siguientePaso === 'true') {
                    setNextExamData(nextExam.data);
                    setIsNextExamModalOpen(true);
                } else {
                    // 9. Si NO hay siguiente examen O siguientePaso es false, mostrar modal de cerrar pestaña
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
                }
                // 2. SEGUNDO: Notificar a todas las ventanas (incluyendo la padre)
                if (windowId) {
                    notifyGuidChange(windowId, nextExamData.guid);
                }

                // 3. TERCERO: Bloquear el nuevo examen
                await blockExam(nextExamData.guid);

                // 4. CUARTO: Esperar un poco para que el servidor procese
                await new Promise(resolve => setTimeout(resolve, 300));

                // 5. QUINTO: Notificar actualización del visor con el nuevo study_instance_uid
                if (windowId && nextExamData.study_instance_uid) {
                    notifyViewerUpdate(windowId, nextExamData.study_instance_uid, nextExamData.guid);
                }

                // 6. SEXTO: Construir la URL
                const params = new URLSearchParams();
                if (modalityId) params.set('modality_id', modalityId);
                if (bodypartId) params.set('bodypart_id', bodypartId);
                if (studyGroupId) params.set('study_group_id', studyGroupId);
                if (windowId) params.set('windowId', windowId);
                if (siguientePaso) params.set('siguiente_paso', siguientePaso);
                if (Array.isArray(nextExamData.flags) && nextExamData.flags.length > 0) {
                    params.set('flags', nextExamData.flags.join(','));
                }
                if (Array.isArray(nextExamData.tag_ids) && nextExamData.tag_ids.length > 0) {
                    params.set('tag_ids', nextExamData.tag_ids.join(','));
                }

                const newUrl = `/estudios/redaccion/redactar-informe/${nextExamData.guid}/${nextExamData.study_instance_uid}?${params.toString()}`;


                // 7. SÉPTIMO: Navegar
                navigate(newUrl);

                setIsNextExamModalOpen(false);
            } catch (error) {
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

    const reportData = (informeDetalle as any)?.data || {};
    const patientName = reportData.patient_name || 'Carlos Fernández';
    const patientIdentifier = reportData.patientid || reportData.patientit || reportData.patient?.patientit || reportData.patient?.patientid || '-';
    const nationalCodeLabel = reportData.national_code || reportData.nationalcode || reportData.nationalCode || reportData.patient?.national_code || reportData.patient?.nationalcode || '-';
    const sexLabel = reportData.sex === 'M' ? 'Masculino' : reportData.sex === 'F' ? 'Femenino' : (reportData.sex || '-');
    const studyLabel = reportData.study_description || reportData.study_type_description || reportData.study_name || 'ANGIOTOMOGRAFÍA PELVIANA O VASOS ILÍACOS';
    const modalityLabel = reportData.modality || reportData.modality_name || 'CT';
    const accessionLabel = reportData.accession_number || reportData.localacc || reportData.admission_number || '-';
    const dateLabel = reportData.exam_date || reportData.date || reportData.study_date || '13/12/2025';
    const statLabel = reportData.stat || reportData.priority || 'A';
    return (
        <LayoutSinSidebar disableDefaultBackground>
            <div className="h-[calc(100vh-24px)] bg-gray-50 dark:bg-[#0f1218] rounded-xl p-2 dark:text-gray-100 flex flex-col overflow-hidden">
                {/* Header con botones de acción */}
                <div className="flex justify-between items-center mb-3 shrink-0">
                    <div className="relative bg-white dark:bg-[#151922] rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 dark:bg-[#1e2430] rounded-full p-2.5">
                                <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                                    {patientName} - {patientIdentifier} - {sexLabel} - {nationalCodeLabel}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {studyLabel} - {modalityLabel} - {accessionLabel} - {dateLabel} - {statLabel}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <FlagsCell
                                        examId={examId}
                                        currentFlags={examFlags}
                                        onUpdate={handleUpdateExamFlags}
                                        isUpdating={isUpdatingFlags || isSigned || !examId}
                                    />
                                    <TagsCell
                                        examId={examId}
                                        currentTagIds={examTagIds}
                                        availableTags={allTags}
                                        onUpdate={handleUpdateExamTags}
                                        isUpdating={isUpdatingTagIds || isSigned || !examId}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <PrimaryButton onClick={handleOpenPdf}>
                                <FileMinus />
                                PDF
                            </PrimaryButton>
                            <PrimaryButton onClick={() => setIsTemplateModalOpen(true)}>
                                <FileText />
                                INFORMES PREDEFINIDOS
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
                <div className="flex-1 min-h-0 relative">
                    <div className="flex gap-1 h-full">
                        {/* Columna central */}
                        <div className="flex-1 space-y-2.5 p-2.5 transition-all ease-in-out min-w-0 bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto h-full table-scrollbar-purple">

                            {/* Toolbar única global */}
                            <div className="sticky top-0 z-20 bg-gray-50 dark:bg-[#0f1218] rounded-md border border-gray-200 dark:border-gray-700 p-1.5 flex items-center gap-0.5 flex-wrap">
                                <button onClick={() => activeEditor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Negrita" disabled={!activeEditor || isSigned}><Bold className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Cursiva" disabled={!activeEditor || isSigned}><Italic className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('underline') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Subrayado" disabled={!activeEditor || isSigned}><UnderlineIcon className="w-4 h-4 dark:text-gray-200" /></button>
                                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                <button onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Lista numerada" disabled={!activeEditor || isSigned}><ListOrdered className="w-4 h-4 dark:text-gray-200" /></button>
                                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                <button onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'left' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Alinear izquierda" disabled={!activeEditor || isSigned}><AlignLeft className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'center' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Centrar" disabled={!activeEditor || isSigned}><AlignCenter className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'right' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Alinear derecha" disabled={!activeEditor || isSigned}><AlignRight className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().setTextAlign('justify').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'justify' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Justificar" disabled={!activeEditor || isSigned}><AlignJustify className="w-4 h-4 dark:text-gray-200" /></button>
                                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                <button onClick={() => activeEditor?.chain().focus().undo().run()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600" type="button" title="Deshacer" disabled={!activeEditor || !activeEditor?.can?.().undo() || isSigned}><Undo className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().redo().run()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600" type="button" title="Rehacer" disabled={!activeEditor || !activeEditor?.can?.().redo() || isSigned}><Redo className="w-4 h-4 dark:text-gray-200" /></button>
                            </div>

                            {/* Historia Clínica */}
                            <div className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                                <div
                                    className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                    onClick={() => toggleSection('historiaClinica')}
                                >
                                    <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Historia Clínica</h3>
                                    {openSections.historiaClinica ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.historiaClinica ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-2">
                                        <textarea
                                            className="w-full h-20 p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e2430] text-gray-800 dark:text-gray-200 resize-y focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                                            placeholder="Historia clínica..."
                                            disabled={isSigned}
                                            value={formData.history}
                                            onChange={(e) => setFormData(prev => ({ ...prev, history: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Técnica de examen */}
                            <div className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div
                                    className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                    onClick={() => toggleSection('tecnica')}
                                >
                                    <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Técnica de examen</h3>
                                    {openSections.tecnica ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tecnica ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                            showToolbar={false}
                                            className="resize-y overflow-auto"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hallazgos */}
                            <div className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div
                                    className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                    onClick={() => toggleSection('hallazgos')}
                                >
                                    <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Hallazgos</h3>
                                    {openSections.hallazgos ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.hallazgos ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                            showToolbar={false}
                                            className="resize-y overflow-auto"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Impresiones */}
                            <div className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div
                                    className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                    onClick={() => toggleSection('impresiones')}
                                >
                                    <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Impresiones</h3>
                                    {openSections.impresiones ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.impresiones ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                            showToolbar={false}
                                            className="resize-y overflow-auto"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Conclusiones */}
                            <div className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div
                                    className="cursor-pointer bg-gray-100 dark:bg-[#1e2430] px-3 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
                                    onClick={() => toggleSection('conclusiones')}
                                >
                                    <h3 className="text-gray-800 dark:text-gray-100 font-semibold">Conclusiones</h3>
                                    {openSections.conclusiones ? <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.conclusiones ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                            showToolbar={false}
                                            className="resize-y overflow-auto"
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
                                    className="bg-gray-200 dark:bg-[#1f2937] h-full hover:bg-gray-300 dark:hover:bg-[#2a3444] text-gray-700 dark:text-gray-200 p-1.5 rounded-md border border-gray-300 dark:border-gray-700 transition-colors"
                                    title={`Ocultar panel lateral (${rightSidebarTabLabel})`}
                                >
                                    <RightSidebarTabIcon className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setRightSidebarOpen(true)}
                                    className="h-full bg-gray-200 dark:bg-[#1f2937] hover:bg-gray-300 dark:hover:bg-[#2a3444] text-gray-700 dark:text-gray-200 p-1.5 rounded-md border border-gray-300 dark:border-gray-700 transition-colors flex items-center justify-center"
                                    title={`Mostrar panel lateral (${rightSidebarTabLabel})`}
                                >
                                    <RightSidebarTabIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Columna derecha - Imágenes */}
                        <div
                            className={`relative shrink-0 h-full origin-right overflow-hidden ${isResizingRightSidebar ? '' : 'transition-opacity duration-200 ease-out'} ${rightSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
                            style={{ width: rightSidebarOpen ? `${rightSidebarWidth}px` : '0px' }}
                        >
                            {rightSidebarOpen && (
                                <button
                                    type="button"
                                    onMouseDown={handleRightSidebarResizeStart}
                                    className="absolute -left-1 top-0 h-full w-2 cursor-col-resize z-20"
                                    title="Redimensionar panel lateral"
                                />
                            )}
                            <div className={`${rightSidebarOpen ? 'opacity-100' : 'opacity-0'} w-full h-full flex flex-col`}>

                                <div className="bg-white dark:bg-[#151922] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
                                    <div className="bg-gray-100 dark:bg-[#1e2430] px-2 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setRightSidebarTab('history')}
                                                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${rightSidebarTab === 'history'
                                                    ? 'bg-white dark:bg-[#151922] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#273043]'
                                                    }`}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                Historia
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRightSidebarTab('images')}
                                                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${rightSidebarTab === 'images'
                                                    ? 'bg-white dark:bg-[#151922] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#273043]'
                                                    }`}
                                            >
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                Imágenes clave
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRightSidebarTab('ai')}
                                                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${rightSidebarTab === 'ai'
                                                    ? 'bg-white dark:bg-[#151922] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#273043]'
                                                    }`}
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Asistencia IA
                                            </button>
                                        </div>
                                    </div>
                                    {rightSidebarTab === 'history' ? (
                                        <div className="p-3 flex-1 min-h-0 overflow-y-auto table-scrollbar-purple">
                                            {patientStudies.length === 0 ? (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">Sin estudios previos</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {patientStudies.map((study: any) => (
                                                        <div key={study.guid} className="flex items-center justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2430] px-3 py-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{study.estudio}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{study.modalidad} · {study.fecha}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenHistoryPdf(study.pdf_path)}
                                                                className="shrink-0 p-1 rounded hover:bg-brand-purple/10 dark:hover:bg-purple-800/30"
                                                                title="Ver PDF"
                                                            >
                                                                <FileIcon className="w-4 h-4 text-brand-purple dark:text-purple-400" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : rightSidebarTab === 'images' ? (
                                        <div className="flex-1 min-h-0 p-3 flex flex-col overflow-hidden">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 shrink-0">
                                                Arrastra las imágenes a los campos de texto
                                            </p>
                                            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 table-scrollbar-purple">
                                                    {images.map((image, index) => (
                                                        <div
                                                            key={image.id}
                                                            draggable
                                                            onDragStart={() => handleDragStart(image)}
                                                            onDragEnd={handleDragEnd}
                                                            className={`cursor-grab active:cursor-grabbing rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors ${draggedImage?.id === image.id ? 'opacity-50 scale-95' : ''
                                                                }`}
                                                            style={{ animationDelay: `${index * 50}ms` }}
                                                        >
                                                            <img
                                                                src={image.url}
                                                                alt={image.name}
                                                                onError={(e) => {
                                                                    const fallbackUrl = getImageUrlByFilename(image.name);
                                                                    if (e.currentTarget.src !== fallbackUrl) {
                                                                        e.currentTarget.src = fallbackUrl;
                                                                    }
                                                                }}
                                                                className="w-full h-auto object-cover"
                                                            />
                                                            <div className="p-2 bg-gray-50 dark:bg-[#2a2e32] text-center">
                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{image.name}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto">
                                            <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-[#1e2430]">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Asistencia IA</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Aquí verás sugerencias para mejorar redacción, estructura y claridad del informe.
                                                </p>
                                            </div>
                                            <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-[#111827] flex-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Selecciona texto del informe para recibir ayuda contextual.
                                                </p>
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
                            setFormData(prev => ({
                                ...prev,
                                techniques: selectedTemplate.technique || '',
                                findings: selectedTemplate.findings || '',
                                impressions: selectedTemplate.impression || '',
                                conclusions: selectedTemplate.conclusion || ''
                            }));
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
                        setFormData(prev => ({
                            ...prev,
                            techniques: selectedTemplate.technique || '',
                            findings: selectedTemplate.findings || '',
                            impressions: selectedTemplate.impression || '',
                            conclusions: selectedTemplate.conclusion || ''
                        }));
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

            {/* Modal PDF historial */}
            {historyPdfUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setHistoryPdfUrl(null)}>
                    <div className="relative bg-white dark:bg-[#151922] rounded-lg shadow-2xl w-[80vw] h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Informe previo</span>
                            <button
                                type="button"
                                onClick={() => setHistoryPdfUrl(null)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                            </button>
                        </div>
                        <iframe src={historyPdfUrl} className="flex-1 w-full rounded-b-lg" title="Informe previo" />
                    </div>
                </div>
            )}
        </LayoutSinSidebar>
    )
}