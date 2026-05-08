import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useAllTags, useInformeDetalle, useUpdateFlags, useUpdateReport, useUpdateTagIds, useUnblockExam, useBlockExam, usePatientHistory } from "../hooks/use-informes";
import { putRedactarInforme } from "../services/informes.service";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ChevronDown, ChevronRight, ChevronUp, FileMinus, Image as ImageIcon, Save, Signature, User, Loader2, X, Sparkles, FileText, Bold, Italic, Underline as UnderlineIcon, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, FileIcon, RefreshCcw, Braces, Search } from "lucide-react";
import { LayoutSinSidebar } from "@/layouts/LayoutSinSidebar";
import { useImagenesPorEstudio } from "@/hooks/use-global";
import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "sonner";
import { criteriaService, type ParserVariableTreeNode, type StructuredCriterion, type CriterionEvaluationResult } from "@/services/criteria.service";
import { useTemplates } from "@/modules/redaccion/informe-predefinidos/hooks/use-templates";
import type { Template } from "@/modules/redaccion/informe-predefinidos/types/informe-pred.types";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useVerifyCredentials } from "./hooks/use-verify-credentials";
import { useSignReport } from "./hooks/use-sing-report";
import { useQuitarFirma } from "./hooks/use-quitar-firma";
import { useNextExam } from "./hooks/use-next-exam";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { informesKeys } from "../constants/query-keys";
import { CloseTabModal, NextExamModal, SignModal, TemplateModal } from "../components/modals";
import { clearWindowStorage, notifyGuidChange, notifyViewerUpdate } from "./hooks/use-cross-windows";
import { FlagsCell } from "../components/FlagsCell";
import { TagsCell } from "../components/TagsCell";
import { useFacility } from "@/context/FacilityContext";
import { api } from "@/lib/api";

const normalizeVariableKey = (value: string | null | undefined): string =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

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
    const reportData = (informeDetalle as any)?.data || {};
    const reportStudyTypeId = String(reportData.study_type_id || '').trim();
    const reportLocationId = String(reportData.location_id || '').trim();
    const structuredReportsEnabled = Boolean(reportData.structured_reports_enabled);
    const { data: imagenes, refetch: refetchImagenes, deleteImagen } = useImagenesPorEstudio(studyInstanceUID || '');
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
    const activeStudyTypeFilter = studyTypeFilter || reportStudyTypeId;
    const reportTypeFilter = structuredReportsEnabled ? undefined : 'simple';
    const { data: templatesData } = useTemplates(
        activeStudyTypeFilter || undefined,
        undefined,
        undefined,
        reportTypeFilter,
    );
    // En tu componente
    const { mutateAsync: verifyCredentials } = useVerifyCredentials();
    const { mutateAsync: signReport } = useSignReport();
    const { mutateAsync: quitarFirma } = useQuitarFirma();
    const { mutateAsync: getNextExam } = useNextExam();
    const { mutateAsync: unblockExam } = useUnblockExam();
    const { mutateAsync: blockExam } = useBlockExam();
    const { selectedFacilityId } = useFacility();

    const { data: facilityPlanData } = useQuery({
        queryKey: ["facility-plan", selectedFacilityId, "redactar-informe", informeGuid],
        queryFn: async () => {
            const response = await api.get(`/config/facilities/${selectedFacilityId}/plan`);
            return response.data?.data || null;
        },
        enabled: Boolean(selectedFacilityId && informeGuid),
        staleTime: 60 * 1000,
    });

    const queryClient = useQueryClient();
    const [isNextExamModalOpen, setIsNextExamModalOpen] = useState(false);
    const [nextExamData, setNextExamData] = useState<any>(null);
    const [isCloseTabModalOpen, setIsCloseTabModalOpen] = useState(false);
    const navigate = useNavigate();

    const readMonthlyLimit: number | null = facilityPlanData?.plan?.max_read_monthly ?? null;
    const readCount: number = facilityPlanData?.usage_monthly?.read_count ?? 0;
    const isReadLimitReached =
        typeof readMonthlyLimit === "number"
        && readMonthlyLimit >= 0
        && readCount >= readMonthlyLimit;

    useEffect(() => {
        if (!informeGuid) return;
        if (!isReadLimitReached) return;
        toast.error(`Límite mensual de redacción alcanzado (${readCount}/${readMonthlyLimit}). No puedes abrir el redactor.`);
        navigate('/estudios/redaccion');
    }, [informeGuid, isReadLimitReached, navigate, readCount, readMonthlyLimit]);

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



    // Filtrar plantillas por búsqueda local y priorizar segun modulo/facility.
    const searchMatchedTemplates = templatesData?.data?.filter((template) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            template.title.toLowerCase().includes(searchLower) ||
            template.study_type_description?.toLowerCase().includes(searchLower)
        );
    }) || [];

    const matchingIntelligentTemplates = searchMatchedTemplates.filter((template) => {
        if (template.report_type !== 'inteligente') return false;
        const locationIds = Array.isArray(template.location_ids) ? template.location_ids : [];
        if (!reportLocationId) return true;
        return locationIds.length === 0 || locationIds.includes(reportLocationId);
    });

    const simpleTemplates = searchMatchedTemplates.filter((template) => template.report_type === 'simple');

    const preferredTemplates = structuredReportsEnabled
        ? (matchingIntelligentTemplates.length > 0 ? matchingIntelligentTemplates : simpleTemplates)
        : simpleTemplates;

    const fallbackTemplates = structuredReportsEnabled
        ? searchMatchedTemplates.filter((template) => !preferredTemplates.some((preferred) => preferred.guid === template.guid))
        : [];

    const filteredTemplates = [...preferredTemplates, ...fallbackTemplates];

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
        const srDebug = (informeDetalle as any)?.debug_sr;
        if (!srDebug) return;

        console.log('[SR DEBUG] study_instance_uid:', srDebug.study_instance_uid);
        console.log('[SR DEBUG] sr_variable_keys_count:', srDebug.sr_variable_keys_count);
        console.log('[SR DEBUG] sr_variable_keys_sample:', srDebug.sr_variable_keys_sample);
        console.log('[SR DEBUG] placeholders_before:', srDebug.placeholders_before);
        console.log('[SR DEBUG] placeholders_after:', srDebug.placeholders_after);
    }, [informeDetalle]);

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

    // Ref para rastrear imágenes ya cargadas (evita reemplazar las arrastradas al campo)
    const loadedImageNamesRef = useRef<Set<string>>(new Set());

    // Estado para las imágenes disponibles
    const [images, setImages] = useState<Array<{ id: number; url: string; name: string }>>([]);
    const [allImages, setAllImages] = useState<Array<{ id: number; url: string; name: string }>>([]);
    const [draggedImage, setDraggedImage] = useState<{ id: number; url: string; name: string } | null>(null);
    const [draggedVariableValue, setDraggedVariableValue] = useState<{
        type: 'variable' | 'criterion';
        text: string;
        label?: string;
    } | null>(null);
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
    const [rightSidebarTab, setRightSidebarTab] = useState<'history' | 'images' | 'variables' | 'ai'>('history');
    const [rightSidebarWidth, setRightSidebarWidth] = useState(380);
    const [srVariableTree, setSrVariableTree] = useState<ParserVariableTreeNode[]>([]);
    const [expandedSrNodeIds, setExpandedSrNodeIds] = useState<Record<string, boolean>>({});
    const [isLoadingSrTree, setIsLoadingSrTree] = useState(false);
    const [srSearchQuery, setSrSearchQuery] = useState('');
    const [iaCriteria, setIaCriteria] = useState<StructuredCriterion[]>([]);
    const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
    const [criteriaEvalResult, setCriteriaEvalResult] = useState<CriterionEvaluationResult | null>(null);
    const [showAllCriteria, setShowAllCriteria] = useState(false);
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
                : rightSidebarTab === 'variables'
                    ? 'Variables'
                : 'Asistencia IA';
    const RightSidebarTabIcon = rightSidebarTab === 'history'
            ? FileText
            : rightSidebarTab === 'images'
                ? ImageIcon
                : rightSidebarTab === 'variables'
                    ? Braces
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
        setDraggedVariableValue(null);
    };

    const handleVariableDragStart = (
        e: React.DragEvent,
        payload: { type?: 'variable' | 'criterion'; text: string; label?: string } | string
    ) => {
        const normalizedPayload = typeof payload === 'string'
            ? { type: 'variable' as const, text: payload, label: payload }
            : {
                type: payload.type || 'variable',
                text: payload.text,
                label: payload.label || payload.text,
            };
        const value = String(normalizedPayload.text || '').trim();
        if (!value) return;

        setDraggedVariableValue({
            type: normalizedPayload.type,
            text: value,
            label: String(normalizedPayload.label || value).trim(),
        });
        setDraggedImage(null);
        e.dataTransfer.setData('text/plain', value);
        e.dataTransfer.setData('application/x-nextris-chip-type', normalizedPayload.type);
        e.dataTransfer.setData('application/x-nextris-chip-label', String(normalizedPayload.label || value).trim());
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragEnd = () => {
        setDraggedImage(null);
        setDraggedVariableValue(null);
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
        const droppedText = (e.dataTransfer.getData('text/plain') || '').trim();
        const draggedChipType = (e.dataTransfer.getData('application/x-nextris-chip-type') || '').trim();
        const draggedChipLabel = (e.dataTransfer.getData('application/x-nextris-chip-label') || '').trim();
        const chipData = draggedVariableValue || (droppedText
            ? {
                type: (draggedChipType === 'criterion' ? 'criterion' : 'variable') as 'variable' | 'criterion',
                text: droppedText,
                label: draggedChipLabel || droppedText,
            }
            : null);

        if (chipData && editor) {
            editor
                .chain()
                .focus()
                .insertContent([
                    {
                        type: chipData.type === 'criterion' ? 'criterionChip' : 'variableChip',
                        attrs: chipData.type === 'criterion'
                            ? {
                                criterionName: chipData.label || chipData.text,
                                displayText: chipData.text,
                            }
                            : {
                                variableName: chipData.label || chipData.text,
                                displayText: chipData.text,
                            },
                    },
                    {
                        type: 'text',
                        text: ' ',
                    },
                ])
                .run();
            setDraggedVariableValue(null);
            setDragOverField(null);
            return;
        }

        if (draggedImage && editor) {
            editor.chain().focus().setImage({
                src: draggedImage.url,
                alt: draggedImage.name,
                title: draggedImage.name
            }).run();
            setImages(prev => prev.filter(img => img.id !== draggedImage.id));
            setDragOverField(null);
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
        if (!imagenes?.images?.length) return;

        const formattedImages = imagenes.images.map((img, index) => {
            const imageData = typeof img.data === 'string' ? img.data : '';
            const imageUrl = imageData
                ? `data:${getImageMimeType(img.filename)};base64,${imageData}`
                : resolveImageUrl(img.path, img.filename);
            return { id: index + 1, url: imageUrl, name: img.filename };
        });

        const newImages = formattedImages.filter(img => !loadedImageNamesRef.current.has(img.name));

        if (newImages.length === 0) return;

        newImages.forEach(img => loadedImageNamesRef.current.add(img.name));

        if (loadedImageNamesRef.current.size === newImages.length) {
            // Carga inicial: todas las imágenes son nuevas
            setImages(formattedImages);
            setAllImages(formattedImages);
        } else {
            // Actualización incremental: solo agregar las nuevas al panel
            setAllImages(formattedImages);
            setImages(prev => [...prev, ...newImages]);
        }
    }, [getImageMimeType, imagenes, resolveImageUrl]);

    // Refrescar imágenes clave cuando el usuario vuelve al redactor (ej: desde el visor DICOM)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refetchImagenes();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [refetchImagenes]);

    useEffect(() => {
        findNextPlaceholderRef.current = findNextPlaceholder;
    }, [findNextPlaceholder]);

    useEffect(() => {
        if (rightSidebarTab !== 'ai') return;
        const manifestId = reportData.sr_parser_manifest_id;
        if (!manifestId) return;
        setIsLoadingCriteria(true);
        setCriteriaEvalResult(null);
        const variablesRecord: Record<string, any> = {};
        const rawVars: Array<{ key?: string; name?: string; value?: string }> =
            Array.isArray(reportData.sr_variables) ? reportData.sr_variables : [];
        rawVars.forEach((v) => {
            const val = String(v.value || '').trim();
            if (!val) return;
            if (v.key) variablesRecord[v.key] = val;
            if (v.name) variablesRecord[v.name] = val;
        });
        criteriaService.list(Number(manifestId), false)
            .then(async (data) => {
                const criteria = Array.isArray(data) ? data : [];
                setIaCriteria(criteria);
                if (criteria.length > 0) {
                    try {
                        const evalResult = await criteriaService.evaluate({
                            parser_manifest_id: Number(manifestId),
                            variables: variablesRecord,
                        });
                        setCriteriaEvalResult(evalResult);
                    } catch {
                        setCriteriaEvalResult(null);
                    }
                }
            })
            .catch(() => setIaCriteria([]))
            .finally(() => setIsLoadingCriteria(false));
    }, [rightSidebarTab, reportData.sr_parser_manifest_id, reportData.sr_variables]);



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
                // 2. Guardar siempre el contenido actual antes de firmar.
                await putRedactarInforme(informeGuid || '', {
                    techniques: formData.techniques,
                    findings: formData.findings,
                    impressions: formData.impressions,
                    conclusions: formData.conclusions,
                    mark_as_reported: false,
                });

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

                const preferredFacilityId = String((reportData as any)?.facility_id || selectedFacilityId || '').trim();
                if (preferredFacilityId) {
                    payload.facility_id = preferredFacilityId;
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

    const srVariables = useMemo<Array<{ key?: string; name?: string; value?: string }>>(
        () => (Array.isArray(reportData.sr_variables) ? reportData.sr_variables : []),
        [reportData.sr_variables]
    );

    const srValueByKey = useMemo(() => {
        const map = new Map<string, string>();

        const addValue = (rawKey: string | undefined, rawValue: string | undefined) => {
            const value = String(rawValue || '').trim();
            if (!value) return;

            const key = String(rawKey || '').trim();
            if (!key) return;

            const normalized = normalizeVariableKey(key);
            if (normalized && !map.has(normalized)) {
                map.set(normalized, value);
            }

            const lower = key.toLowerCase();
            if (lower && !map.has(lower)) {
                map.set(lower, value);
            }
        };

        srVariables.forEach((item) => {
            addValue(item.key, item.value);
            addValue(item.name, item.value);
        });

        return map;
    }, [srVariables]);

    const criteriaDisplayItems = useMemo(() => {
        const evaluatedById = new Map(
            (criteriaEvalResult?.evaluated_items || []).map((item) => [item.criterion_id, item])
        );
        const matchedById = new Map(
            (criteriaEvalResult?.matches || []).map((item) => [item.criterion_id, item])
        );

        const statusOrder: Record<'then' | 'else' | 'none', number> = {
            then: 0,
            else: 1,
            none: 2,
        };

        const items = iaCriteria.map((criterion) => {
            const ruleDefinition = (criterion.rule_definition || {}) as Record<string, any>;
            const elseFallbackText = String(ruleDefinition.else_output_text || '').trim();
            const evaluatedItem = evaluatedById.get(criterion.id);
            const matchedItem = matchedById.get(criterion.id);
            const evaluatedBranch = String(evaluatedItem?.branch || '').toLowerCase();
            const isMatched = typeof evaluatedItem?.matched === 'boolean'
                ? evaluatedItem.matched
                : Boolean(matchedItem);
            const evaluatedText = String(evaluatedItem?.output_text || '').trim();
            const matchedText = String(matchedItem?.output_text || '').trim();
            const resolvedText = criteriaEvalResult
                ? (evaluatedText || matchedText || (!isMatched ? elseFallbackText : ''))
                : String(criterion.output_text || '').trim();

            let status: 'then' | 'else' | 'none' = 'none';
            if (resolvedText) {
                if (criteriaEvalResult) {
                    if (evaluatedBranch === 'else' || (!isMatched && elseFallbackText)) {
                        status = 'else';
                    } else if (evaluatedBranch === 'then' || isMatched) {
                        status = 'then';
                    }
                } else {
                    status = 'then';
                }
            }

            const displayText = resolvedText || (criteriaEvalResult && evaluatedBranch === 'else'
                ? 'No cumple condicion (sin texto alternativo configurado)'
                : '');

            return {
                criterion,
                status,
                isMatched,
                evaluatedBranch,
                displayText,
                dragText: resolvedText,
                canDrag: Boolean(resolvedText),
            };
        });

        return items.sort((a, b) => {
            const byStatus = statusOrder[a.status] - statusOrder[b.status];
            if (byStatus !== 0) return byStatus;
            const byPriority = (a.criterion.priority ?? 0) - (b.criterion.priority ?? 0);
            if (byPriority !== 0) return byPriority;
            return a.criterion.id - b.criterion.id;
        });
    }, [iaCriteria, criteriaEvalResult]);

    const visibleCriteriaItems = useMemo(() => {
        if (showAllCriteria) return criteriaDisplayItems;
        return criteriaDisplayItems.filter((item) => item.status !== 'none');
    }, [criteriaDisplayItems, showAllCriteria]);

    const expandAllGroupNodes = useCallback((nodes: ParserVariableTreeNode[]) => {
        const next: Record<string, boolean> = {};

        const walk = (items: ParserVariableTreeNode[]) => {
            items.forEach((node) => {
                if (node.type === 'group') {
                    next[node.id] = true;
                    if (Array.isArray(node.children) && node.children.length > 0) {
                        walk(node.children);
                    }
                }
            });
        };

        walk(nodes || []);
        return next;
    }, []);

    const hydrateTreeWithValues = useCallback((nodes: ParserVariableTreeNode[]): ParserVariableTreeNode[] => {
        const resolveValue = (node: ParserVariableTreeNode): string => {
            const metadata = node.metadata || {};
            const existingValue = String((metadata as any).value || '').trim();
            if (existingValue) {
                return existingValue;
            }

            const candidates = [
                String(metadata.variable_key || '').trim(),
                String(metadata.variable_name || '').trim(),
                String(node.label || '').trim(),
            ].filter(Boolean);

            for (const candidate of candidates) {
                const normalized = normalizeVariableKey(candidate);
                if (normalized && srValueByKey.has(normalized)) {
                    return srValueByKey.get(normalized) || '';
                }

                const lower = candidate.toLowerCase();
                if (lower && srValueByKey.has(lower)) {
                    return srValueByKey.get(lower) || '';
                }
            }

            return '';
        };

        const walk = (items: ParserVariableTreeNode[]): ParserVariableTreeNode[] =>
            items.map((node) => {
                if (node.type === 'group') {
                    const children = Array.isArray(node.children) ? walk(node.children) : [];
                    return {
                        ...node,
                        children,
                        children_count: children.length,
                    };
                }

                const value = resolveValue(node);
                return {
                    ...node,
                    metadata: {
                        ...(node.metadata || {}),
                        value,
                        has_value: Boolean(value),
                    } as ParserVariableTreeNode['metadata'],
                };
            });

        return walk(nodes || []);
    }, [srValueByKey]);

    useEffect(() => {
        const embeddedTree = Array.isArray(reportData.sr_variable_tree) ? reportData.sr_variable_tree : [];
        if (embeddedTree.length > 0) {
            const hydrated = hydrateTreeWithValues(embeddedTree);
            setSrVariableTree(hydrated);
            setExpandedSrNodeIds(expandAllGroupNodes(hydrated));
            return;
        }

        const parserManifestId = Number(reportData.sr_parser_manifest_id || 0);
        if (!parserManifestId) {
            setSrVariableTree([]);
            setExpandedSrNodeIds({});
            return;
        }

        let cancelled = false;

        const loadTree = async () => {
            setIsLoadingSrTree(true);
            try {
                const treeResponse = await criteriaService.listParserVariableTree(parserManifestId);
                if (cancelled) return;

                const nodes = Array.isArray(treeResponse.nodes) ? treeResponse.nodes : [];
                const hydrated = hydrateTreeWithValues(nodes);
                setSrVariableTree(hydrated);
                setExpandedSrNodeIds(expandAllGroupNodes(hydrated));
            } catch {
                if (!cancelled) {
                    setSrVariableTree([]);
                    setExpandedSrNodeIds({});
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingSrTree(false);
                }
            }
        };

        loadTree();

        return () => {
            cancelled = true;
        };
    }, [
        reportData.sr_parser_manifest_id,
        reportData.sr_variable_tree,
        expandAllGroupNodes,
        hydrateTreeWithValues,
    ]);

    const toggleSrNodeExpanded = (nodeId: string) => {
        setExpandedSrNodeIds((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    const filterSrTree = (nodes: ParserVariableTreeNode[], query: string): ParserVariableTreeNode[] => {
        const q = query.trim().toLowerCase();
        if (!q) return nodes;
        return nodes.reduce<ParserVariableTreeNode[]>((acc, node) => {
            if (node.type === 'group') {
                const filteredChildren = filterSrTree(node.children || [], q);
                if (filteredChildren.length > 0) {
                    acc.push({ ...node, children: filteredChildren });
                }
            } else {
                const label = (node.label || '').toLowerCase();
                const value = String((node.metadata as any)?.value || '').toLowerCase();
                if (label.includes(q) || value.includes(q)) {
                    acc.push(node);
                }
            }
            return acc;
        }, []);
    };

    const renderSrTreeNodes = (nodes: ParserVariableTreeNode[], depth = 0) => {
        const leftPadding = 8 + depth * 14;

        return nodes.map((node) => {
            const isGroup = node.type === 'group';
            const isExpanded = Boolean(expandedSrNodeIds[node.id]);
            const value = String((node.metadata as any)?.value || '').trim();
            const displayValue = value || 'No disponible';
            const canDrag = Boolean(value);

            return (
                <div key={node.id} className="space-y-1">
                    <button
                        type="button"
                        className={`w-full rounded-md border px-2 py-1.5 text-left ${
                            isGroup
                                ? 'border-gray-200 dark:border-gray-700 bg-background/60 hover:border-brand-purple/60'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2430]'
                        }`}
                        style={{ paddingLeft: `${leftPadding}px` }}
                        onClick={() => {
                            if (isGroup) {
                                toggleSrNodeExpanded(node.id);
                            }
                        }}
                        draggable={!isGroup && canDrag}
                        onDragStart={(e) => {
                            if (!isGroup && canDrag) {
                                handleVariableDragStart(e, { type: 'variable', text: value, label: node.label });
                            }
                        }}
                        onDragEnd={handleDragEnd}
                        title={!isGroup && canDrag ? 'Arrastra el valor al editor' : undefined}
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
                            <span className="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{node.label}</span>
                            {isGroup && (
                                <span className="ml-auto text-[10px] text-muted-foreground">{node.children_count || 0}</span>
                            )}
                        </div>

                        {!isGroup && (
                            <p
                                className={`mt-1 break-all text-sm ${
                                    value
                                        ? 'text-brand-purple dark:text-purple-300'
                                        : 'text-gray-500 dark:text-gray-400 italic'
                                }`}
                            >
                                {displayValue}
                            </p>
                        )}
                    </button>

                    {isGroup && isExpanded && Array.isArray(node.children) && node.children.length > 0 && (
                        <div className="space-y-1">{renderSrTreeNodes(node.children, depth + 1)}</div>
                    )}
                </div>
            );
        });
    };

    if (isLoading) {
        return <LayoutSinSidebar>
            <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin w-8 h-8 text-brand-purple" />
            </div>
        </LayoutSinSidebar>;
    }

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
                                        <div className="grid grid-cols-4 gap-1">
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
                                                IA / Criterios
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRightSidebarTab('variables')}
                                                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${rightSidebarTab === 'variables'
                                                    ? 'bg-white dark:bg-[#151922] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#273043]'
                                                    }`}
                                            >
                                                <Braces className="w-3.5 h-3.5" />
                                                Variables
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
                                            <div className="flex items-center justify-between mb-4 shrink-0">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Arrastra las imágenes a los campos de texto
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => refetchImagenes()}
                                                    title="Actualizar imágenes"
                                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-brand-purple dark:hover:text-purple-400 transition-colors"
                                                >
                                                    <RefreshCcw className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 table-scrollbar-purple">
                                                    {images.map((image, index) => (
                                                        <div
                                                            key={image.id}
                                                            draggable
                                                            onDragStart={() => handleDragStart(image)}
                                                            onDragEnd={handleDragEnd}
                                                            className={`relative group cursor-grab active:cursor-grabbing rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors ${draggedImage?.id === image.id ? 'opacity-50 scale-95' : ''
                                                                }`}
                                                            style={{ animationDelay: `${index * 50}ms` }}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        await deleteImagen(image.name);
                                                                        loadedImageNamesRef.current.delete(image.name);
                                                                        setImages(prev => prev.filter(img => img.id !== image.id));
                                                                        setAllImages(prev => prev.filter(img => img.id !== image.id));
                                                                    } catch {
                                                                        toast.error('No se pudo eliminar la imagen');
                                                                    }
                                                                }}
                                                                className="absolute top-1 right-1 z-10 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                                title="Eliminar imagen"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
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
                                    ) : rightSidebarTab === 'variables' ? (
                                        <div className="flex flex-col flex-1 min-h-0">
                                            {/* Buscador */}
                                            <div className="px-3 pt-3 pb-2 shrink-0">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={srSearchQuery}
                                                        onChange={(e) => setSrSearchQuery(e.target.value)}
                                                        placeholder="Buscar variable..."
                                                        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-background py-1.5 pl-8 pr-7 text-xs text-gray-700 dark:text-gray-200 placeholder:text-muted-foreground outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/40 transition-colors"
                                                    />
                                                    {srSearchQuery && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSrSearchQuery('')}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Contenido */}
                                            <div className="px-3 pb-3 flex-1 min-h-0 overflow-y-auto table-scrollbar-purple">
                                            {isLoadingSrTree ? (
                                                <div className="flex items-center justify-center mt-4">
                                                    <Loader2 className="animate-spin w-5 h-5 text-brand-purple" />
                                                </div>
                                            ) : srVariableTree.length > 0 ? (
                                                (() => {
                                                    const filtered = filterSrTree(srVariableTree, srSearchQuery);
                                                    return filtered.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {renderSrTreeNodes(filtered)}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">Sin resultados</p>
                                                    );
                                                })()
                                            ) : srVariables.length === 0 ? (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">Sin variables SR para este estudio</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {srVariables
                                                        .filter((variable) => {
                                                            if (!srSearchQuery.trim()) return true;
                                                            const q = srSearchQuery.trim().toLowerCase();
                                                            return (
                                                                (variable.name || '').toLowerCase().includes(q) ||
                                                                (variable.key || '').toLowerCase().includes(q) ||
                                                                String(variable.value || '').toLowerCase().includes(q)
                                                            );
                                                        })
                                                        .map((variable, index) => (
                                                        <div
                                                            key={`${variable.key || variable.name || 'var'}-${index}`}
                                                            draggable={Boolean(String(variable.value || '').trim())}
                                                            onDragStart={(e) => handleVariableDragStart(e, {
                                                                type: 'variable',
                                                                text: String(variable.value || ''),
                                                                label: variable.name || variable.key || String(variable.value || ''),
                                                            })}
                                                            onDragEnd={handleDragEnd}
                                                            className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2430] p-2.5 cursor-grab active:cursor-grabbing hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                                                            title="Arrastra el valor al editor"
                                                        >
                                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 break-all">{variable.name || variable.key || '-'}</p>
                                                            <p className="text-sm text-brand-purple dark:text-purple-300 mt-1 break-all">{variable.value || '-'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto table-scrollbar-purple">
                                            {/* Asistencia IA placeholder */}
                                            <div className="p-3 shrink-0">
                                                <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-[#1e2430]">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Asistencia IA</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Aquí verás sugerencias para mejorar redacción, estructura y claridad del informe.
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Criterios del tipo de estudio */}
                                            <div className="px-3 pb-3 flex flex-col gap-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Criterios</p>
                                                    <label className="flex items-center gap-1.5 select-none cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={showAllCriteria}
                                                            onChange={(e) => setShowAllCriteria(e.target.checked)}
                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                                                        />
                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Mostrar todos</span>
                                                    </label>
                                                </div>
                                                {isLoadingCriteria ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="animate-spin w-5 h-5 text-brand-purple" />
                                                    </div>
                                                ) : !reportData.sr_parser_manifest_id ? (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">No hay parser SR asociado a este tipo de estudio</p>
                                                ) : iaCriteria.length === 0 ? (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">Sin criterios definidos para este tipo de estudio</p>
                                                ) : visibleCriteriaItems.length === 0 ? (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">No hay criterios con salida. Activa "Mostrar todos" para ver los pendientes.</p>
                                                ) : (
                                                    visibleCriteriaItems
                                                        .map(({ criterion, status, isMatched, evaluatedBranch, displayText, dragText, canDrag }) => {
                                                            return (
                                                                <div
                                                                    key={criterion.id}
                                                                    draggable={canDrag}
                                                                    onDragStart={(e) => {
                                                                        if (canDrag) {
                                                                            handleVariableDragStart(e, {
                                                                                type: 'criterion',
                                                                                text: dragText,
                                                                                label: criterion.criterion_name,
                                                                            });
                                                                        }
                                                                    }}
                                                                    onDragEnd={handleDragEnd}
                                                                    className={`rounded-md border p-2.5 transition-colors ${
                                                                        status === 'then'
                                                                            ? 'border-green-300 dark:border-green-600 bg-green-100/90 dark:bg-green-900/35 shadow-[0_0_0_1px_rgba(34,197,94,0.25)] cursor-grab active:cursor-grabbing'
                                                                            : status === 'else'
                                                                                ? 'border-orange-300 dark:border-orange-600 bg-orange-100/90 dark:bg-orange-900/35 shadow-[0_0_0_1px_rgba(251,146,60,0.25)] cursor-grab active:cursor-grabbing'
                                                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2430] opacity-45'
                                                                    }`}
                                                                    title={canDrag ? 'Arrastra el resultado al editor' : undefined}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        {criteriaEvalResult && (
                                                                            <span className={`shrink-0 text-xs font-bold leading-none ${
                                                                                isMatched ? 'text-green-500 dark:text-green-400' : 'text-gray-400'
                                                                            }`}>
                                                                                {isMatched ? '✓' : '✗'}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1 truncate">
                                                                            {criterion.criterion_name}
                                                                        </span>
                                                                        {criteriaEvalResult && evaluatedBranch && (
                                                                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                                                                status === 'else'
                                                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                                                                    : status === 'then'
                                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                                            }`}>
                                                                                {status.toUpperCase()}
                                                                            </span>
                                                                        )}
                                                                        {typeof criterion.priority === 'number' && (
                                                                            <span className="shrink-0 rounded-full bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-purple dark:text-purple-300">
                                                                                P{criterion.priority}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {displayText && (
                                                                        <p className={`text-xs break-words whitespace-pre-wrap ${
                                                                            isMatched
                                                                                ? 'text-green-700 dark:text-green-300'
                                                                                : 'text-gray-500 dark:text-gray-400'
                                                                        }`}>{displayText}</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                )}
                                                {!showAllCriteria && criteriaDisplayItems.length > visibleCriteriaItems.length && (
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 text-right">
                                                        Mostrando {visibleCriteriaItems.length} de {criteriaDisplayItems.length} criterios
                                                    </p>
                                                )}
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