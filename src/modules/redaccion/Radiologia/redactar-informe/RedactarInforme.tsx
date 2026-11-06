import { useAuth } from "@/context/AuthContext";
import { ExamViewerButton } from "@/components/ExamViewerButton";
import { hasAnyPermission } from "@/lib/permissions";
import { openReportPdf, staffReportPdfLink } from '@/services/reportPdf';
import type { CombinedHistoryEntry } from '@/types/patientHistory';
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { onAssistantCommandAcknowledged, registerAssistantHandler } from "@/assistant/commands"
import type { AssistantResult } from "@/assistant/commands"
import { applyReportEdits, readReportBlocks, reportSnapshot, REPORT_FIELDS } from "@/assistant/reportEditing"
import type { ReportEdit } from "@/assistant/reportEditing"
import { useAllTags, useInformeDetalle, useUpdateFlags, useUpdateReport, useUpdateTagIds, useUnblockExam, useBlockExam, usePatientHistory } from "../hooks/use-informes";
import { putRedactarInforme } from "../services/informes.service";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Cat, Dog, PawPrint, ChevronDown, ChevronRight, FileMinus, FileX, Image as ImageIcon, Save, Signature, User, Mars, Venus, Loader2, X, Sparkles, FileText, Bold, Italic, Underline as UnderlineIcon, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, FileIcon, RefreshCcw, Braces, Search, SkipForward, Share2 } from "lucide-react";
import { LayoutSinSidebar } from "@/layouts/LayoutSinSidebar";
import { useImagenesPorEstudio } from "@/hooks/use-global";
import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "sonner";
import { criteriaService, type ParserVariableTreeNode, type StructuredCriterion, type CriterionEvaluationResult } from "@/services/criteria.service";
import { useTemplates } from "@/modules/redaccion/informe-predefinidos/hooks/use-templates";
import type { Template } from "@/modules/redaccion/informe-predefinidos/types/informe-pred.types";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useSignReport } from "./hooks/use-sing-report";
import { useQuitarFirma } from "./hooks/use-quitar-firma";
import { useNextExam } from "./hooks/use-next-exam";
import { useQueryClient } from "@tanstack/react-query";
import { informesKeys } from "../constants/query-keys";
import { CloseTabModal, NextExamModal, SignModal, TemplateModal } from "../components/modals";
import { clearWindowStorage, notifyGuidChange, notifyViewerUpdate } from "./hooks/use-cross-windows";
import { FlagsCell } from "../components/FlagsCell";
import { TagsCell } from "../components/TagsCell";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReportNotesPanel } from "./components/ReportNotesPanel";
import { closeViewerWindow } from "@/services/viewerWindow";
import { formatDate } from "@/lib/fechaYhora";
import { AdministrativeShareModal } from "../components/AdministrativeShareModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mergeTemplateStudyReason } from "./reportTemplate";

const normalizeVariableKey = (value: string | null | undefined): string =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const parseBooleanParam = (value: string | null, fallback: boolean): boolean => {
    if (value === null) return fallback;
    return ['true', '1', 'on', 'yes'].includes(value.trim().toLowerCase());
};



type ReportFormData = {
    study_reason: string;
    content: string;
    conclusion: string;
};

type BracketMatch = {
    text: string;
    index: number;
    contentStart: number;
    contentEnd: number;
};

const EMPTY_REPORT_FORM: ReportFormData = {
    study_reason: '',
    content: '',
    conclusion: '',
};

const hasReportContent = (value: string | null | undefined) => {
    const document = new DOMParser().parseFromString(value || '', 'text/html');
    const text = (document.body.textContent || '').replace(/\u200B/g, '').trim();

    return Boolean(
        text || document.body.querySelector('img, [data-variable-chip="true"], [data-criterion-chip="true"]'),
    );
};

export const RedactarInforme = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { informeGuid, studyInstanceUID } = useParams();
    const [searchParams] = useSearchParams();
    const uploadMode = searchParams.get('upload') === '1';
    const assistantMode = searchParams.get('assistant') === '1' || uploadMode;
    const closeEditorWindow = () => assistantMode ? navigate('/worklist') : window.close();

    // Obtener los parámetros
    const modalityId = searchParams.get('modality_id');
    const bodypartId = searchParams.get('bodypart_id');
    const studyGroupId = searchParams.get('study_group_id');
    const windowId = searchParams.get('windowId');
    const siguientePaso = searchParams.get('siguiente_paso');
    const shouldOpenNextExam = ['true', '1', 'on', 'yes'].includes(
        String(siguientePaso || '').trim().toLowerCase()
    );
    const flagsParam = searchParams.get('flags');
    const tagIdsParam = searchParams.get('tag_ids');
    const nextExamFilters = {
        show_ready: parseBooleanParam(searchParams.get('show_ready'), true),
        show_reported: parseBooleanParam(searchParams.get('show_reported'), false),
        assigned_to_me: parseBooleanParam(searchParams.get('assigned_to_me'), false),
        show_no_image: parseBooleanParam(searchParams.get('show_no_image'), false),
        show_without_order: parseBooleanParam(searchParams.get('show_without_order'), false),
        sort_column: searchParams.get('sort_column') || '',
        sort_direction: searchParams.get('sort_direction') === 'desc' ? 'desc' as const : 'asc' as const,
    };

    const initialFlagsFromParams = flagsParam
        ? flagsParam.split(',').map((value) => value.trim()).filter(Boolean)
        : [];
    const initialTagIdsFromParams = tagIdsParam
        ? tagIdsParam.split(',').map((value) => value.trim()).filter(Boolean)
        : [];

    const { informeDetalle, isLoading } = useInformeDetalle(informeGuid);
    const reportData = (informeDetalle as any)?.data || {};
    const reportReadOnly = Boolean(
        reportData.report_read_only
        || reportData.workflow_state === 'cancelled'
    );
    const reportStudyTypeId = String(reportData.study_type_id || '').trim();
    const reportLocationId = String(reportData.location_id || '').trim();
    const structuredReportsEnabled = Boolean(reportData.structured_reports_enabled);
    const { data: imagenes, refetch: refetchImagenes, deleteImagen } = useImagenesPorEstudio(studyInstanceUID || '');
    const updateReportMutation = useUpdateReport(informeGuid || '');
    const { mutate: updateFlags, isPending: isUpdatingFlags } = useUpdateFlags();
    const { mutate: updateTagIds, isPending: isUpdatingTagIds } = useUpdateTagIds();
    const { allTags } = useAllTags();
    const [formData, setFormData] = useState<ReportFormData>(EMPTY_REPORT_FORM);
    const initialReportDataRef = useRef<ReportFormData>(EMPTY_REPORT_FORM);
    const initializedReportGuidRef = useRef<string | undefined>(undefined);
    const defaultAppliedReportGuidRef = useRef<string | undefined>(undefined);
    const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
    const [examFlags, setExamFlags] = useState<string[]>(initialFlagsFromParams);
    const [examTagIds, setExamTagIds] = useState<string[]>(initialTagIdsFromParams);
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    const { authData } = useAuth();
    const canShare = hasAnyPermission(authData?.user?.permissions, ['worklist.share']);
    const [shareKind, setShareKind] = useState<'study' | 'images' | null>(null);
    const shareStudyUid = String(reportData.study_instance_uid || studyInstanceUID || '').trim();
    useEffect(() => { setShareKind(null); }, [informeGuid]);
    const canSign = hasAnyPermission(authData?.user?.permissions, ['reports.sign']);
    const canUnsign = hasAnyPermission(authData?.user?.permissions, ['reports.unsign']);
    const canToggleReportSignature = isSigned ? canUnsign : canSign;

    // La firma se autoriza por permiso de usuario; no requiere reingresar contraseña.
    const requirePasswordForSigning = false;

    // Estados para el modal de plantillas
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [onlyStudyType, setOnlyStudyType] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isWorkflowInfoModalOpen, setIsWorkflowInfoModalOpen] = useState(false);
    const workflowInfoShownRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!informeGuid || !reportData.workflow_state || reportData.workflow_state === 'pending') return;
        if (workflowInfoShownRef.current === informeGuid) return;
        workflowInfoShownRef.current = informeGuid;
        setIsWorkflowInfoModalOpen(true);
    }, [informeGuid, reportData.workflow_state]);

    // Hooks para plantillas
    const reportTypeFilter = structuredReportsEnabled ? undefined : 'simple';
    const { data: templatesByStudyType } = useTemplates(
        reportStudyTypeId || undefined,
        undefined,
        undefined,
        reportTypeFilter,
        Boolean(reportStudyTypeId),
    );
    const { data: modalTemplates, isLoading: isLoadingTemplates, isError: templatesError } = useTemplates(
        onlyStudyType && reportStudyTypeId ? reportStudyTypeId : undefined,
        undefined,
        undefined,
        reportTypeFilter,
        isTemplateModalOpen,
    );
    const studyTypeDefaultTemplate = reportStudyTypeId
        ? templatesByStudyType?.data?.find((template) => template.is_user_default)
            || templatesByStudyType?.data?.find((template) => template.is_system_default)
        : undefined;
    const hasStudyTypeDefault = Boolean(studyTypeDefaultTemplate);
    const templateOptions = modalTemplates?.data || [];
    // En tu componente
    const { mutateAsync: signReport } = useSignReport();
    const { mutateAsync: quitarFirma } = useQuitarFirma();
    const { mutateAsync: getNextExam } = useNextExam();
    const { mutateAsync: unblockExam } = useUnblockExam();
    const { mutateAsync: blockExam } = useBlockExam();
    const queryClient = useQueryClient();
    const [isNextExamModalOpen, setIsNextExamModalOpen] = useState(false);
    const [nextExamData, setNextExamData] = useState<any>(null);
    const [isCloseTabModalOpen, setIsCloseTabModalOpen] = useState(false);
    const [isSkipConfirmationOpen, setIsSkipConfirmationOpen] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
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
    const searchMatchedTemplates = templateOptions.filter((template) => {
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
    const defaultTemplate = hasStudyTypeDefault ? studyTypeDefaultTemplate : undefined;

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
            if (initializedReportGuidRef.current === informeGuid) return;

            initializedReportGuidRef.current = informeGuid;
            const cachedExamMeta = getExamMetaFromCachedLists();

            const detailData = informeDetalle.data as any;
            const nextFormData: ReportFormData = {
                study_reason: detailData.study_reason || detailData.clinical_question || detailData.history || '',
                content: detailData.content || detailData.findings || '',
                conclusion: detailData.conclusion || detailData.conclusions || '',
            };
            initialReportDataRef.current = nextFormData;
            setFormData(nextFormData);
            setAppliedTemplateId(detailData.applied_template_id || null);
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
    }, [getExamMetaFromCachedLists, informeDetalle?.data, informeGuid]);

    const applyTemplateToReport = useCallback((template: Template) => {
        if (reportReadOnly) return;
        const examinationReason = reportData.clinical_question || reportData.history || '';
        setAppliedTemplateId(template.guid);
        setFormData(prev => ({
            ...prev,
            study_reason: mergeTemplateStudyReason(template.study_reason, examinationReason),
            content: template.content || template.findings || '',
            conclusion: template.conclusion || '',
        }));
    }, [reportData.clinical_question, reportData.history, reportReadOnly]);

    // Algunos reportes antiguos llegan vacíos aunque exista un default asociado.
    // Aplicarlo desde el frontend evita que el redactor quede en blanco mientras
    // se mantiene la selección equivalente en el backend.
    useEffect(() => {
        if (!informeGuid || !informeDetalle?.data || !defaultTemplate || reportReadOnly) return;
        if (defaultAppliedReportGuidRef.current === informeGuid) return;

        const reportAlreadyHasContent = [
            informeDetalle.data.study_reason,
            informeDetalle.data.content,
            informeDetalle.data.conclusion,
        ].some(hasReportContent);
        const localReportAlreadyHasContent = [
            formData.study_reason,
            formData.content,
            formData.conclusion,
        ].some(hasReportContent);

        if (reportAlreadyHasContent || localReportAlreadyHasContent) {
            defaultAppliedReportGuidRef.current = informeGuid;
            return;
        }

        defaultAppliedReportGuidRef.current = informeGuid;
        applyTemplateToReport(defaultTemplate);
    }, [applyTemplateToReport, defaultTemplate, formData, informeDetalle?.data, informeGuid, reportReadOnly]);

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
    const currentHistoryGuid = String(informeDetalle?.data?.exam_id || informeGuid || '').trim().toLowerCase();
    const currentHistoryStudyUid = String(
        studyInstanceUID || reportData?.study_instance_uid || ''
    ).trim().toLowerCase();
    const currentHistoryAccession = String(reportData.accession_number || reportData.localacc || '').trim();
    const patientStudies = (historyData?.data || []).filter((study) => {
        const studyGuid = String(study.guid || '').trim().toLowerCase();
        const studyUid = String(study.studyinstanceuid || '').trim().toLowerCase();

        if (currentHistoryAccession && study.accession_number === currentHistoryAccession) return false;
        if (currentHistoryGuid && studyGuid === currentHistoryGuid) return false;
        if (currentHistoryStudyUid && studyUid === currentHistoryStudyUid) return false;
        return true;
    });


    const handleOpenHistoryReport = async (study: CombinedHistoryEntry) => {
        const examId = study.local_exam_id;
        if ((study.source === 'nextris' && !patientId) || (study.source === 'nextris' && !examId)) {
            toast.error('No se encontró el ID del estudio para consultar NextRIS');
            return;
        }
        try {
            // The external report ID remains authoritative even when linked to a local exam.
            if (!examId) return;
            await openReportPdf(staffReportPdfLink(examId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No se pudo abrir el informe previo');
        }
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
        study_reason: any;
        content: any;
        conclusion: any;
    }>({
        study_reason: null,
        content: null,
        conclusion: null
    });
    const assistantRevision = useRef(crypto.randomUUID());
    const assistantSnapshot = useRef<ReturnType<typeof reportSnapshot> | null>(null);
    const assistantSnapshotSequence = useRef(0);
    const assistantEditSequence = useRef(0);
    const assistantMutation = useRef(false);
    const assistantUndo = useRef<{ before: ReturnType<typeof reportSnapshot>; after: ReturnType<typeof reportSnapshot>; sequence: number } | null>(null);

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

    // Estados para controlar la visibilidad de los sidebars
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [rightSidebarTab, setRightSidebarTab] = useState<'history' | 'images' | 'variables' | 'ai'>('history');
    const [rightSidebarWidth, setRightSidebarWidth] = useState(285);
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
    const rightSidebarResizeStartWidthRef = useRef(285);
    const rightSidebarResizeMovedRef = useRef(false);

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
        rightSidebarResizeMovedRef.current = false;
        rightSidebarResizeStartXRef.current = e.clientX;
        rightSidebarResizeStartWidthRef.current = rightSidebarWidth;
        setIsResizingRightSidebar(true);
    };

    const handleRightSidebarToggle = () => {
        const wasResized = rightSidebarResizeMovedRef.current;
        rightSidebarResizeMovedRef.current = false;

        if (wasResized && rightSidebarOpen) return;
        setRightSidebarOpen((isOpen) => !isOpen);
    };

    useEffect(() => {
        if (!isResizingRightSidebar) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (Math.abs(e.clientX - rightSidebarResizeStartXRef.current) > 4) {
                rightSidebarResizeMovedRef.current = true;
            }
            const delta = rightSidebarResizeStartXRef.current - e.clientX;
            const nextWidth = Math.max(240, Math.min(420, rightSidebarResizeStartWidthRef.current + delta));
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

    const handleChange = (field: string, value: string) => {
        if (reportReadOnly) {
            toast.info('Este estudio fue cancelado y no puede modificarse.');
            return;
        }
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

        if (!assistantMutation.current) assistantEditSequence.current += 1;
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

    const handleEditorContainerClick = useCallback((
        event: React.MouseEvent<HTMLDivElement>,
        fieldName: 'content' | 'conclusion',
    ) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('[contenteditable="true"]')) {
            // El editor editable ya sabe ubicar el cursor donde se hizo click.
            return;
        }

        const editor = editorsRef.current[fieldName];
        if (!editor || editor.isDestroyed) return;

        const editorElement = editor.view.dom as HTMLElement;
        const bounds = editorElement.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) return;

        // posAtCoords necesita coordenadas dentro del área editable. Si el
        // click ocurrió en el espacio muerto del contenedor, lo aproximamos al
        // borde más cercano del editor para obtener la posición más próxima.
        const left = Math.max(bounds.left + 1, Math.min(event.clientX, bounds.right - 1));
        const top = Math.max(bounds.top + 1, Math.min(event.clientY, bounds.bottom - 1));
        const position = editor.view.posAtCoords({ left, top });

        if (position) {
            editor.commands.focus(position.pos);
        } else {
            editor.commands.focus('end');
        }
    }, []);

    const getBracketMatches = (editor: any): BracketMatch[] => {
        // Aceptar tanto campos con corchetes simples ([campo]) como el formato
        // anterior con dobles corchetes ([[campo]]). El primer alternador evita
        // que un campo doble se interprete como uno simple.
        const text = editor.getText({ blockSeparator: '\n' });
        const regex = /\[\[([^\]]*)\]\]|\[([^[]*)\]/g;
        const matches: BracketMatch[] = [];
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            const fieldText = match[1] ?? match[2] ?? '';
            const openingLength = match[1] !== undefined ? 2 : 1;
            const contentStart = match.index + openingLength;

            matches.push({
                text: fieldText,
                index: match.index,
                contentStart,
                contentEnd: contentStart + fieldText.length,
            });
        }

        return matches;
    };

    // Convierte un índice del texto serializado por TipTap en una posición de
    // ProseMirror. Esto mantiene la selección correcta aun cuando el informe
    // tiene varios párrafos o texto con formato.
    const getEditorPositionAtTextOffset = (editor: any, textOffset: number): number | null => {
        const doc = editor.state.doc;
        let position: number | null = null;

        doc.descendants((node: any, pos: number) => {
            if (!node.isText || position !== null) return;

            const textBeforeNode = doc.textBetween(0, pos, '\n');
            const nodeStart = textBeforeNode.length;
            const nodeEnd = nodeStart + node.text.length;

            if (textOffset >= nodeStart && textOffset <= nodeEnd) {
                position = pos + (textOffset - nodeStart);
            }
        });

        return position;
    };

    const findPlaceholder = useCallback((direction: 'next' | 'previous') => {
        const fieldOrder: Array<keyof typeof editorsRef.current> = ['study_reason', 'content', 'conclusion'];
        let currentFieldIndex = fieldOrder.indexOf(currentFieldRef.current as keyof typeof editorsRef.current);
        if (currentFieldIndex === -1) currentFieldIndex = 0;

        for (let offset = 0; offset < fieldOrder.length; offset++) {
            const fieldIndex = direction === 'next'
                ? (currentFieldIndex + offset) % fieldOrder.length
                : (currentFieldIndex - offset + fieldOrder.length) % fieldOrder.length;
            const fieldName = fieldOrder[fieldIndex];
            const editor = editorsRef.current[fieldName];

            if (!editor || editor.isDestroyed) continue;

            const positionedMatches = getBracketMatches(editor)
                .map((match) => ({
                    match,
                    from: getEditorPositionAtTextOffset(editor, match.contentStart),
                    to: getEditorPositionAtTextOffset(editor, match.contentEnd),
                }))
                .filter((item): item is { match: BracketMatch; from: number; to: number } =>
                    item.from !== null && item.to !== null
                );

            if (positionedMatches.length === 0) continue;

            if (offset === 0 && fieldName === currentFieldRef.current) {
                const { from, to } = editor.state.selection;
                const currentMatch = direction === 'next'
                    ? positionedMatches.find((item) => item.from >= to)
                    : [...positionedMatches].reverse().find((item) => item.to <= from);

                if (currentMatch) {
                    selectPlaceholder(editor, currentMatch.match, fieldName);
                    return true;
                }
                continue;
            }

            const target = direction === 'next'
                ? positionedMatches[0]
                : positionedMatches[positionedMatches.length - 1];
            selectPlaceholder(editor, target.match, fieldName);
            return true;
        }

        lastPlaceholderIndexRef.current = -1;
        toast.info('No se encontraron más campos entre corchetes');
        return false;
    }, []);

    const findNextPlaceholder = useCallback(() => findPlaceholder('next'), [findPlaceholder]);
    const findPreviousPlaceholder = useCallback(() => findPlaceholder('previous'), [findPlaceholder]);

    // Selecciona únicamente el contenido, dejando los corchetes fuera de la selección.
    const selectPlaceholder = (editor: any, match: BracketMatch, fieldName: string) => {
        currentFieldRef.current = fieldName;
        setActiveEditorField(fieldName as keyof typeof editorsRef.current);

        editor.commands.focus();

        setTimeout(() => {
            if (editor && !editor.isDestroyed) {
                const from = getEditorPositionAtTextOffset(editor, match.contentStart);
                const to = getEditorPositionAtTextOffset(editor, match.contentEnd);
                if (from === null || to === null) return;

                editor.commands.setTextSelection({
                    from,
                    to,
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

    const handleOpenReport = async () => {
        if (!informeGuid) {
            toast.error('No se encontró el ID del examen');
            return;
        }
        try {
            await openReportPdf(staffReportPdfLink(informeGuid));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No se pudo abrir el informe');
        }
    };


    const handleGuardarInforme = () => {
        if (reportReadOnly) {
            toast.info('Este estudio fue cancelado y no puede modificarse.');
            return;
        }
        if (!informeGuid) {
            toast.error('No se encontró el ID del examen');
            return;
        }

        const dataToSave = {
            study_reason: formData.study_reason,
            content: formData.content,
            conclusion: formData.conclusion,
            template_id: appliedTemplateId || undefined,
            mark_as_reported: false
        };

        updateReportMutation.mutate(dataToSave, {
            onSuccess: () => {
                initialReportDataRef.current = { ...formData };
            },
        });
    };

    const reportHasUnsavedChanges = useMemo(
        () => (Object.keys(formData) as Array<keyof ReportFormData>)
            .some((field) => formData[field] !== initialReportDataRef.current[field]),
        [formData],
    );

    const validateReportBeforeSigning = () => {
        const fields = [formData.study_reason, formData.content, formData.conclusion];
        const requiredFields = fields;
        const emptyBracketPattern = /\[\s*\[\s*\]\s*\]/;

        if (fields.some((field) => emptyBracketPattern.test(field))) {
            toast.error('No se puede firmar un informe con campos vacíos o brackets vacíos [[]]');
            return false;
        }

        if (requiredFields.some((field) => !hasReportContent(field))) {
            toast.error('No se puede firmar un informe con campos vacíos');
            return false;
        }

        return true;
    };

    const handleVerifyCredentials = async () => {
        if (!canToggleReportSignature) return;
        if (!isSigned && !validateReportBeforeSigning()) {
            return;
        }

        setIsSigning(true);

        try {
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
                    study_reason: formData.study_reason,
                    content: formData.content,
                    conclusion: formData.conclusion,
                    template_id: appliedTemplateId || undefined,
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

                // 3. Firmar reporte
                await signReport({
                    informeGuid: informeGuid || '',
                    ...payload
                });

                // 4. Obtener siguiente examen
                const nextExam = await getNextExam({
                    ...payload,
                    current_exam_id: informeGuid || '',
                    ...nextExamFilters,
                });

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

                // 8. Si hay siguiente examen Y siguientePaso está activado, abrirlo automáticamente.
                if (nextExam?.data && shouldOpenNextExam) {
                    toast.info('Abriendo siguiente estudio...');
                    await handleOpenNextExam(nextExam.data);
                } else {
                    // Cerrar inmediatamente
                    toast.success('Informe firmado exitosamente');
                    if (windowId) {
                        clearWindowStorage(windowId);
                    }
                    setTimeout(closeEditorWindow, 300);
                }
            }
        } catch (error) {
            console.error('Error en el proceso de firma:', error);
            const requestError = error as any;
            toast.error(
                requestError?.response?.data?.message ||
                'No se pudo verificar la contraseña o firmar el informe.'
            );
        } finally {
            setIsSigning(false);
        }
    };

    const handleSignWithoutPassword = async (assistantCommandId?: string): Promise<AssistantResult> => {
        if (!canSign) return { status: "forbidden" };
        if (!informeGuid) {
            toast.error('No se encontró el ID del informe');
            return { status: 'unavailable' };
        }

        if (!validateReportBeforeSigning()) {
            return { status: 'validation_failed' };
        }

        setIsSigning(true);

        try {
            // 1. Guardar siempre el contenido actual antes de firmar.
            await putRedactarInforme(informeGuid, {
                study_reason: formData.study_reason,
                content: formData.content,
                conclusion: formData.conclusion,
                template_id: appliedTemplateId || undefined,
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

            // 3. Firmar reporte
            await signReport({
                informeGuid: informeGuid,
                ...payload
            });
            initialReportDataRef.current = { ...formData };
            assistantUndo.current = null;

            // 4. La firma ya se confirmó en el servidor.
            setIsSigned(true);
            try { await unblockExam(informeGuid); }
            catch (error) { console.error('No se pudo liberar el bloqueo tras firmar:', error); }
            queryClient.invalidateQueries({
                queryKey: informesKeys.lists()
            });
            let nextExam: Awaited<ReturnType<typeof getNextExam>> | null = null;
            try {
                nextExam = await getNextExam({
                    ...payload,
                    current_exam_id: informeGuid,
                    ...nextExamFilters,
                });
            } catch (error) { console.error('No se pudo consultar el siguiente estudio:', error); }

            // 8. Si hay siguiente examen Y siguientePaso está activado, abrir siguiente examen directamente
            const finish = () => {
                if (nextExam?.data && shouldOpenNextExam) {
                    toast.info('Abriendo siguiente estudio...');
                    void handleOpenNextExam(nextExam.data);
                } else {
                    if (!nextExam?.data) toast.info('No hay siguiente estudio disponible');
                    else toast.success('Informe firmado exitosamente');
                    if (windowId) clearWindowStorage(windowId);
                    setTimeout(closeEditorWindow, 300);
                }
            };
            if (assistantCommandId) onAssistantCommandAcknowledged(assistantCommandId, finish);
            else finish();
            return { status: 'ok', signed: true, view: 'editor', hasUnsavedChanges: false };
        } catch (error) {
            console.error('Error al firmar:', error);
            const requestError = error as any;
            toast.error(
                requestError?.response?.data?.message ||
                'No se pudo firmar el informe.'
            );
            return { status: 'error' };
        } finally {
            setIsSigning(false);
        }
    };

    useEffect(() => {
        return registerAssistantHandler('editor', async (command): Promise<AssistantResult> => {
            const snapshot = reportSnapshot(editorsRef.current);
            if (command.kind === 'context') return {
                status: 'ok', view: 'editor', hasUnsavedChanges: reportHasUnsavedChanges,
                signed: isSigned, readOnly: reportReadOnly || isMobile,
            };
            if (command.kind === 'worklist') {
                if (reportHasUnsavedChanges && !window.confirm('Hay cambios sin guardar en el informe. ¿Descartarlos e ir a la worklist?')) {
                    return { status: 'cancelled', view: 'editor', hasUnsavedChanges: true };
                }
                try {
                    if (informeGuid) await unblockExam(informeGuid);
                    onAssistantCommandAcknowledged(command.id, () => {
                        if (sessionStorage.getItem('nextris-assistant-child')) closeEditorWindow();
                        else navigate('/worklist');
                    });
                    return { status: 'ok', view: 'worklist' };
                } catch { return { status: 'error' }; }
            }
            if (command.kind === 'report_header') {
                if (isLoading || initializedReportGuidRef.current !== informeGuid || !informeDetalle?.data)
                    return { status: 'loading' };
                // This explicit command shares only the fields rendered in the header.
                const display = (value: unknown) => String(value ?? '').trim();
                const header = {
                    patientName: display(reportData.patient_name),
                    patientId: display(reportData.patientid || reportData.patientit || reportData.patient?.patientit || reportData.patient?.patientid),
                    nationalCode: display(reportData.national_code || reportData.nationalcode || reportData.nationalCode || reportData.patient?.national_code || reportData.patient?.nationalcode),
                    sex: display(reportData.sex === 'M' ? 'Masculino' : reportData.sex === 'F' ? 'Femenino' : reportData.sex),
                    study: display(reportData.study_description || reportData.study_type_description || reportData.study_name),
                    modality: display(reportData.modality || reportData.modality_name || reportData.modality_description),
                    accession: display(reportData.accession_number || reportData.localacc || reportData.admission_number),
                    date: display(formatDate(reportData.exam_date || reportData.created_on || reportData.date || reportData.study_date)),
                    priority: display(reportData.stat || reportData.priority),
                };
                return { status: 'ok', view: 'editor', header };
            }
            if (command.kind === 'report_context') {
                if (isLoading || initializedReportGuidRef.current !== informeGuid
                    || REPORT_FIELDS.some(field => !editorsRef.current[field])) return { status: 'loading' };
                const identity = [reportData.patient_name, reportData.patientid, reportData.patientit,
                    reportData.national_code, reportData.nationalcode, reportData.nationalCode,
                    reportData.accession_number, reportData.localacc, reportData.admission_number,
                    reportData.study_instance_uid, reportData.exam_id, informeGuid,
                    reportData.patient?.patientid, reportData.patient?.patientit,
                    reportData.patient?.national_code];
                const fields = readReportBlocks(editorsRef.current, identity);
                if (!fields) return { status: 'unsafe_context' };
                if (!assistantSnapshot.current || assistantSnapshotSequence.current !== assistantEditSequence.current
                    || REPORT_FIELDS.some(field => assistantSnapshot.current?.[field] !== snapshot[field])) {
                    assistantRevision.current = crypto.randomUUID();
                    assistantSnapshot.current = snapshot;
                    assistantSnapshotSequence.current = assistantEditSequence.current;
                }
                return { status: 'ok', view: 'editor', fields, revision: assistantRevision.current,
                    signed: isSigned, readOnly: reportReadOnly || isMobile,
                    hasUnsavedChanges: reportHasUnsavedChanges };
            }
            if (command.kind === 'report_edit') {
                if (isLoading || initializedReportGuidRef.current !== informeGuid) return { status: 'loading' };
                if (isSigned || reportReadOnly || isMobile || isSigning || updateReportMutation.isPending) return { status: 'read_only' };
                if (command.args.expectedRevision !== assistantRevision.current || !assistantSnapshot.current
                    || assistantSnapshotSequence.current !== assistantEditSequence.current
                    || REPORT_FIELDS.some(field => assistantSnapshot.current?.[field] !== snapshot[field])) return { status: 'conflict' };
                if (!Array.isArray(command.args.edits)) return { status: 'invalid_edit' };
                assistantMutation.current = true;
                let applied;
                try { applied = applyReportEdits(editorsRef.current, command.args.edits as ReportEdit[]); }
                finally { assistantMutation.current = false; }
                if (applied.status !== 'ok') return applied;
                const after = reportSnapshot(editorsRef.current);
                assistantUndo.current = { before: snapshot, after, sequence: assistantEditSequence.current };
                assistantSnapshot.current = after;
                assistantSnapshotSequence.current = assistantEditSequence.current;
                assistantRevision.current = crypto.randomUUID();
                return { status: 'ok', revision: assistantRevision.current, editCount: applied.editCount, hasUnsavedChanges: true };
            }
            if (command.kind === 'report_undo') {
                if (isSigned || reportReadOnly || isMobile) return { status: 'read_only' };
                const undo = assistantUndo.current;
                if (!undo || undo.sequence !== assistantEditSequence.current
                    || REPORT_FIELDS.some(field => undo.after[field] !== snapshot[field])) return { status: 'conflict' };
                assistantMutation.current = true;
                try { for (const field of REPORT_FIELDS) editorsRef.current[field]?.commands.setContent(undo.before[field]); }
                finally { assistantMutation.current = false; }
                assistantUndo.current = null;
                assistantSnapshot.current = reportSnapshot(editorsRef.current);
                assistantSnapshotSequence.current = assistantEditSequence.current;
                assistantRevision.current = crypto.randomUUID();
                return { status: 'ok', revision: assistantRevision.current };
            }
            if (command.kind === 'report_save') {
                if (isLoading || initializedReportGuidRef.current !== informeGuid) return { status: 'loading' };
                if (isSigned || reportReadOnly || isMobile || isSigning) return { status: 'read_only' };
                if (!informeGuid) return { status: 'unavailable' };
                try {
                    await updateReportMutation.mutateAsync({
                        study_reason: snapshot.study_reason, content: snapshot.content, conclusion: snapshot.conclusion,
                        template_id: appliedTemplateId || undefined, mark_as_reported: false,
                    });
                    initialReportDataRef.current = snapshot;
                    assistantUndo.current = null;
                    return { status: 'ok', hasUnsavedChanges: false };
                } catch { return { status: 'save_failed' }; }
            }
            if (command.kind === 'report_sign') {
                if (isLoading || initializedReportGuidRef.current !== informeGuid) return { status: 'loading' };
                if (isSigned || reportReadOnly || isMobile || isSigning || isSkipping || updateReportMutation.isPending) return { status: 'read_only' };
                return handleSignWithoutPassword(command.id);
            }
            return { status: 'unsupported' };
        });
    }, [reportHasUnsavedChanges, isSigned, reportReadOnly, isMobile, isLoading, isSigning, isSkipping,
        updateReportMutation, appliedTemplateId, informeGuid, informeDetalle, unblockExam, reportData, closeEditorWindow, navigate, canSign]);

    const handleSignAction = () => {
        if (!canToggleReportSignature) return;
        if (reportReadOnly) {
            toast.info('Este estudio fue cancelado y no puede modificarse.');
            return;
        }
        if (isSigning || isSkipping || updateReportMutation.isPending) return;

        if (isSigned) {
            setIsSignModalOpen(true);
            return;
        }
        if (!requirePasswordForSigning) {
            void handleSignWithoutPassword();
            return;
        }
        setIsSignModalOpen(true);
    };

    const handleCloseTab = () => {
        if (assistantMode && reportHasUnsavedChanges && !window.confirm('Hay cambios sin guardar en el informe. ¿Descartarlos y volver a la worklist?')) return;
        unblockExam(informeGuid || '').finally(() => {
            // Limpiar localStorage antes de cerrar
            if (windowId) {
                localStorage.removeItem(windowId);
            }
            closeEditorWindow();
        });
        // redirigir a una página de confirmación o al dashboard
        if (!assistantMode) setTimeout(() => {
            toast.info('Por favor cierra la pestaña manualmente');
        }, 100);
    };

    const handleStayOnPage = () => {
        setIsCloseTabModalOpen(false);
    };
    const handleOpenNextExam = async (
        examData?: typeof nextExamData,
        options?: { releaseCurrentExam?: boolean },
    ) => {
        if (reportReadOnly) {
            toast.info('Este estudio está en modo solo lectura y no permite seleccionar el siguiente examen desde el redactor.');
            return;
        }
        const dataToUse = examData || nextExamData;
        if (!dataToUse) {
            toast.error('No se recibió información del siguiente estudio');
            return;
        }

        try {
                // 1. PRIMERO: Actualizar localStorage localmente
                if (windowId) {
                    localStorage.setItem(windowId, dataToUse.guid);
                }
                // 2. SEGUNDO: Notificar a todas las ventanas (incluyendo la padre)
                if (windowId) {
                    notifyGuidChange(windowId, dataToUse.guid);
                }

                // 3. TERCERO: Bloquear el nuevo examen
                await blockExam(dataToUse.guid);

                if (
                    options?.releaseCurrentExam
                    && currentInformeGuidRef.current
                    && currentInformeGuidRef.current !== dataToUse.guid
                ) {
                    await unblockExam(currentInformeGuidRef.current);
                }

                // 4. CUARTO: Esperar un poco para que el servidor procese
                await new Promise(resolve => setTimeout(resolve, 300));

                // 5. QUINTO: Notificar actualización del visor con el nuevo study_instance_uid
                if (windowId && dataToUse.study_instance_uid) {
                    notifyViewerUpdate(windowId, dataToUse.study_instance_uid, dataToUse.guid);
                }

                // 6. SEXTO: Construir la URL
                const params = new URLSearchParams();
                if (modalityId) params.set('modality_id', modalityId);
                if (bodypartId) params.set('bodypart_id', bodypartId);
                if (studyGroupId) params.set('study_group_id', studyGroupId);
                if (windowId) params.set('windowId', windowId);
                if (siguientePaso) params.set('siguiente_paso', siguientePaso);
                if (Array.isArray(dataToUse.flags) && dataToUse.flags.length > 0) {
                    params.set('flags', dataToUse.flags.join(','));
                }
                if (Array.isArray(dataToUse.tag_ids) && dataToUse.tag_ids.length > 0) {
                    params.set('tag_ids', dataToUse.tag_ids.join(','));
                }

                const studyPath = dataToUse.study_instance_uid
                    ? `/${encodeURIComponent(dataToUse.study_instance_uid)}`
                    : '';
                const newUrl = `/worklist/redactar-informe/${encodeURIComponent(dataToUse.guid)}${studyPath}?${params.toString()}`;


                // 7. SÉPTIMO: Recargar la ventana con el nuevo examen.
                // Esto garantiza que se reinicien los datos del redactor abierto en una ventana secundaria.
                window.location.assign(newUrl);

                setIsNextExamModalOpen(false);
        } catch (error) {
            console.error('Error al abrir el siguiente examen:', error);
            const requestError = error as any;
            toast.error(
                requestError?.response?.data?.message ||
                'Error al abrir el siguiente examen'
            );
        }
    };

    const handleSkipNextExam = () => {
        setIsNextExamModalOpen(false);
        setNextExamData(null);
        toast.success('Informe firmado exitosamente');
    };

    const executeSkipReport = async () => {
        if (!informeGuid || isSkipping || isSigning || updateReportMutation.isPending) return;

        setIsSkipConfirmationOpen(false);
        setIsSkipping(true);

        const payload: Record<string, string> = {};
        if (modalityId && modalityId !== 'undefined') payload.modality_id = modalityId;
        if (bodypartId && bodypartId !== 'undefined') payload.body_part_id = bodypartId;
        if (studyGroupId && studyGroupId !== 'undefined') payload.study_group_id = studyGroupId;

        try {
            const nextExam = await getNextExam({
                ...payload,
                current_exam_id: informeGuid,
                ...nextExamFilters,
            });

            if (!nextExam?.data) {
                toast.info('No hay siguiente estudio disponible');
                return;
            }

            toast.info('Abriendo siguiente estudio...');
            await handleOpenNextExam(nextExam.data, { releaseCurrentExam: true });
        } catch (error) {
            console.error('Error al saltar el estudio:', error);
            const requestError = error as { response?: { data?: { message?: string } } };
            toast.error(requestError?.response?.data?.message || 'No se pudo abrir el siguiente estudio');
        } finally {
            setIsSkipping(false);
        }
    };

    const handleSkipReport = () => {
        if (reportReadOnly) return;
        if (isSkipping || isSigning || updateReportMutation.isPending) return;
        if (reportHasUnsavedChanges) {
            setIsSkipConfirmationOpen(true);
            return;
        }
        void executeSkipReport();
    };

    // Función para cerrar la ventana de forma segura (desbloqueando primero)
    // Al cerrar la ventana
    const handleCloseWindow = async () => {
        if (assistantMode && reportHasUnsavedChanges && !window.confirm('Hay cambios sin guardar en el informe. ¿Descartarlos y volver a la worklist?')) return;
        // El visor se abre desde la ventana de la lista de trabajo, por lo
        // que se cierra mediante BroadcastChannel antes de cerrar el redactor.
        closeViewerWindow();

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

                setTimeout(closeEditorWindow, 300);
            } catch (error) {
                console.error('Error al desbloquear:', error);
                if (windowId) {
                    clearWindowStorage(windowId);
                }
                closeEditorWindow();
            }
        } else {
            if (windowId) {
                clearWindowStorage(windowId);
            }
            closeEditorWindow();
        }
    };

    useEffect(() => {
        const handleActionShortcut = (event: KeyboardEvent) => {
            const supportedKeys = ['F1', 'F2', 'F3', 'F4', 'F8'];
            const isNextPlaceholderKey = event.key === 'PageDown' || event.code === 'PageDown';
            const isPreviousPlaceholderKey = event.key === 'PageUp' || event.code === 'PageUp';
            if (!supportedKeys.includes(event.key) && !isNextPlaceholderKey && !isPreviousPlaceholderKey) return;

            // PageUp/PageDown siguen navegando el documento cuando el foco no
            // está dentro de uno de los editores del informe.
            if (isNextPlaceholderKey || isPreviousPlaceholderKey) {
                const editorHasFocus = Object.values(editorsRef.current).some((editor) =>
                    editor && !editor.isDestroyed && editor.view.dom.contains(document.activeElement)
                );
                if (!editorHasFocus) return;
            }

            event.preventDefault();
            if (event.repeat) return;

            const hasOpenModal = Boolean(
                isSignModalOpen
                || isTemplateModalOpen
                || isConfirmationModalOpen
                || isSkipConfirmationOpen
                || isNextExamModalOpen
                || isCloseTabModalOpen
                || document.querySelector('[role="dialog"][data-state="open"]')
            );
            const actionIsPending = isSigning || isSkipping || updateReportMutation.isPending;
            if (hasOpenModal || actionIsPending) return;

            if (event.key === 'F1') {
                handleSignAction();
            } else if (event.key === 'F2') {
                if (!isSigned) handleGuardarInforme();
            } else if (event.key === 'F3') {
                findNextPlaceholder();
            } else if (event.key === 'F4') {
                handleSkipReport();
            } else if (event.key === 'F8') {
                void handleCloseWindow();
            } else if (isNextPlaceholderKey) {
                findNextPlaceholder();
            } else if (isPreviousPlaceholderKey) {
                findPreviousPlaceholder();
            }
        };

        window.addEventListener('keydown', handleActionShortcut);
        return () => window.removeEventListener('keydown', handleActionShortcut);
    });

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

    // Esperar a que el efecto de inicialización copie el informe al estado antes
    // de montar TipTap. Si los editores se crean con cadenas vacías y reciben la
    // plantilla inmediatamente después, pueden conservar el documento inicial
    // vacío aunque el formulario ya tenga el contenido del predefinido.
    const isReportFormInitialized = initializedReportGuidRef.current === informeGuid;

    if (isLoading || !informeDetalle?.data || !isReportFormInitialized) {
        return <LayoutSinSidebar>
            <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin w-8 h-8 text-brand-purple" />
            </div>
        </LayoutSinSidebar>;
    }

    const patientName = reportData.patient_name || 'Paciente sin nombre';
    const patientIdentifier = reportData.patientid || reportData.patientit || reportData.patient?.patientit || reportData.patient?.patientid;
    const nationalCodeLabel = reportData.national_code || reportData.nationalcode || reportData.nationalCode || reportData.patient?.national_code || reportData.patient?.nationalcode;
    const sexLabel = reportData.sex === 'M' ? 'Masculino' : reportData.sex === 'F' ? 'Femenino' : reportData.sex;
    const studyLabel = reportData.study_description || reportData.study_type_description || reportData.study_name;
    const modalityLabel = reportData.modality || reportData.modality_name || reportData.modality_description;
    const accessionLabel = reportData.accession_number || reportData.localacc || reportData.admission_number;
    const dateLabel = formatDate(reportData.exam_date || reportData.created_on || reportData.date || reportData.study_date);
    const statLabel = reportData.stat || reportData.priority;
    const normalizedSex = String(reportData.sex ?? '').trim().toUpperCase();
    const veterinaryContext = reportData.veterinary_context;
    const speciesName = String(veterinaryContext?.species_name ?? '').trim().toLowerCase();
    const SubjectIcon = veterinaryContext
        ? /felin|gat[oa]/.test(speciesName) ? Cat : /canin|perr[oa]/.test(speciesName) ? Dog : PawPrint
        : normalizedSex === 'M' || normalizedSex === 'MASCULINO'
            ? Mars
            : normalizedSex === 'F' || normalizedSex === 'FEMENINO'
                ? Venus
                : User;
    const headerValue = (value: unknown) => {
        const normalized = String(value ?? '').trim();
        return normalized && normalized !== '-' ? normalized : 'N/D';
    };
    const patientHeaderFields = [
        { label: veterinaryContext ? 'Animal' : 'Paciente', value: patientName },
        { label: veterinaryContext ? 'ID del animal' : 'Patient ID', value: patientIdentifier },
        { label: 'Sexo', value: sexLabel },
        ...(veterinaryContext ? [] : [{ label: 'National Code', value: nationalCodeLabel }]),
    ];
    const responsibleNames = (veterinaryContext?.responsibles || []).map((r: { name: string }) => r.name).join(', ');
    const veterinaryHeaderFields = veterinaryContext ? [
        { label: 'Especie', value: veterinaryContext.species_name || 'Especie pendiente' },
        { label: 'Raza', value: veterinaryContext.breed_name || 'Raza desconocida' },
        { label: 'Peso registrado', value: veterinaryContext.weight_kg != null ? `${veterinaryContext.weight_kg} kg` : 'Peso sin registrar' },
        { label: 'Fecha de nacimiento', value: veterinaryContext.birthdate ? `${veterinaryContext.birthdate_estimated ? 'Nacimiento estimado' : 'Nacimiento'}: ${veterinaryContext.birthdate}` : 'Nacimiento no informado' },
        { label: 'Responsables al realizar el estudio', value: `${(veterinaryContext.responsibles || []).length > 1 ? 'Responsables' : 'Responsable'}: ${responsibleNames || 'Pendiente'}` },
    ] : [];
    const studyHeaderFields = [
        { label: 'Estudio', value: studyLabel },
        { label: 'Modalidad', value: modalityLabel },
        { label: 'Accession', value: accessionLabel },
        { label: 'Fecha', value: dateLabel },
        { label: 'Estado', value: statLabel },
    ];
    const renderHeaderFields = (fields: typeof patientHeaderFields) => fields.map((field, index) => (
        <span key={field.label}>
            {index > 0 && <span aria-hidden="true"> - </span>}
            <span title={field.label} className="cursor-help">
                {headerValue(field.value)}
            </span>
        </span>
    ));
    const hasAvailableReport = Boolean(reportData.report_available);
    return (
        <LayoutSinSidebar disableDefaultBackground>
            <div className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-xl bg-gray-50 p-2 dark:bg-[#0f1218] dark:text-gray-100 lg:h-[calc(100dvh-24px)]">
                {/* Encabezado del estudio y notas */}
                <div className="mb-3 flex shrink-0 items-center justify-between">
                    <div className="relative flex w-full flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-[#151922] md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-3 md:items-center">
                            <div className="bg-gray-100 dark:bg-[#1e2430] rounded-full p-2.5">
                                <SubjectIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="mb-1 break-words text-base font-semibold text-gray-800 dark:text-gray-100 sm:text-lg md:text-xl">
                                    {renderHeaderFields(patientHeaderFields)}
                                </h1>
                                {veterinaryContext && <p className="mb-1 break-words text-xs text-gray-600 dark:text-gray-300 md:text-sm">
                                    {renderHeaderFields(veterinaryHeaderFields)}
                                </p>}
                                <p className="break-words text-xs text-gray-600 dark:text-gray-300 md:text-sm">
                                    {renderHeaderFields(studyHeaderFields)}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    {reportData.workflow_state === 'cancelled' && (
                                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-200">
                                            Cancelado{reportData.workflow_detail ? ` · ${reportData.workflow_detail}` : ''}
                                        </span>
                                    )}
                                    {uploadMode && examId && <ExamViewerButton examId={examId} />}
                                    <FlagsCell
                                        examId={examId}
                                        currentFlags={examFlags}
                                        onUpdate={handleUpdateExamFlags}
                                        isUpdating={isUpdatingFlags || isSigned || isMobile || !examId}
                                    />
                                    <TagsCell
                                        examId={examId}
                                        currentTagIds={examTagIds}
                                        availableTags={allTags}
                                        onUpdate={handleUpdateExamTags}
                                        isUpdating={isUpdatingTagIds || isSigned || isMobile || !examId}
                                    />
                                    {hasAvailableReport && (
                                        <button
                                            type="button"
                                            onClick={handleOpenReport}
                                            className="flex h-9 items-center gap-2 rounded-md bg-brand-purple px-3 text-xs font-semibold text-white transition hover:bg-purple-800"
                                        >
                                            <FileMinus className="h-4 w-4" />
                                            Ver informe
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <ReportNotesPanel key={examId} examId={examId} />

                        <div className="grid gap-2 md:hidden">
                            <PrimaryButton onClick={handleCloseWindow}>
                                <X className="h-4 w-4" />
                                CANCELAR
                            </PrimaryButton>
                        </div>
                    </div>

                </div>

                <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 md:hidden">
                    Modo consulta móvil. Para editar, guardar o firmar este informe utiliza una tablet o una computadora.
                </div>

                {/* Layout de tres columnas con sidebars colapsables */}
                <div className="flex-1 min-h-0 relative">
                    <div className="flex gap-1 h-full">
                        {/* Columna central */}
                        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2.5 transition-all ease-in-out table-scrollbar-purple dark:border-gray-700 dark:bg-[#151922]">

                            {/* Toolbar única global */}
                            <div className="sticky top-0 z-20 hidden flex-wrap items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 p-1.5 dark:border-gray-700 dark:bg-[#0f1218] md:flex">
                                <button onClick={() => activeEditor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Negrita" disabled={!activeEditor || isSigned || reportReadOnly}><Bold className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Cursiva" disabled={!activeEditor || isSigned || reportReadOnly}><Italic className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('underline') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Subrayado" disabled={!activeEditor || isSigned || reportReadOnly}><UnderlineIcon className="w-4 h-4 dark:text-gray-200" /></button>
                                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                <button onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Lista numerada" disabled={!activeEditor || isSigned || reportReadOnly}><ListOrdered className="w-4 h-4 dark:text-gray-200" /></button>
                                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                <button onClick={() => activeEditor?.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'left' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Alinear izquierda" disabled={!activeEditor || isSigned || reportReadOnly}><AlignLeft className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'center' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Centrar" disabled={!activeEditor || isSigned || reportReadOnly}><AlignCenter className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'right' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Alinear derecha" disabled={!activeEditor || isSigned || reportReadOnly}><AlignRight className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().setTextAlign('justify').run()} className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeEditor?.isActive?.({ textAlign: 'justify' }) ? 'bg-gray-300 dark:bg-gray-600' : ''}`} type="button" title="Justificar" disabled={!activeEditor || isSigned || reportReadOnly}><AlignJustify className="w-4 h-4 dark:text-gray-200" /></button>
                                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                <button onClick={() => activeEditor?.chain().focus().undo().run()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600" type="button" title="Deshacer" disabled={!activeEditor || !activeEditor?.can?.().undo() || isSigned || reportReadOnly}><Undo className="w-4 h-4 dark:text-gray-200" /></button>
                                <button onClick={() => activeEditor?.chain().focus().redo().run()} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600" type="button" title="Rehacer" disabled={!activeEditor || !activeEditor?.can?.().redo() || isSigned || reportReadOnly}><Redo className="w-4 h-4 dark:text-gray-200" /></button>
                                <button
                                    type="button"
                                    onClick={() => setIsTemplateModalOpen(true)}
                                    disabled={isSigned || reportReadOnly}
                                    className="ml-auto flex h-8 items-center gap-2 rounded-md bg-brand-purple px-3 text-xs font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Abrir informes predefinidos"
                                >
                                    <FileText className="h-4 w-4" />
                                    INFORMES PREDEFINIDOS
                                </button>
                            </div>

                            <div
                                className="report-editor-sections table-scrollbar-purple flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overflow-x-hidden rounded-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#151922]"
                            >
                            {/* Razón del estudio */}
                            <div className="flex min-h-0 shrink-0 flex-col p-1">
                                <div className="px-1">
                                    <RichTextEditor
                                        value={formData.study_reason}
                                        onChange={(value) => handleChange('study_reason', value)}
                                        placeholder="Razón del estudio..."
                                        dragOver={dragOverField === 'study_reason'}
                                        onDragOver={(e) => handleDragOver(e, 'study_reason')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'study_reason', editorsRef.current.study_reason)}
                                        onEditorReady={(editor) => handleEditorReady(editor, 'study_reason')}
                                        readOnly={isSigned || isMobile || reportReadOnly}
                                        readOnlyLabel={reportReadOnly ? "Estudio en modo solo lectura" : (isMobile ? "Modo consulta móvil" : undefined)}
                                        showToolbar={false}
                                        autoGrow
                                        className="report-editor-rich-text h-10 min-h-0 resize-y overflow-auto"
                                    />
                                </div>
                            </div>

                            {/* Contenido */}
                            <div
                                className="report-editor-body-section flex min-h-0 flex-col p-1"
                                onClick={(event) => handleEditorContainerClick(event, 'content')}
                            >
                                <div className="flex min-h-0 flex-1 px-1">
                                    <RichTextEditor
                                        value={formData.content}
                                        onChange={(value) => handleChange('content', value)}
                                        placeholder="Contenido del estudio..."
                                        dragOver={dragOverField === 'content'}
                                        onDragOver={(e) => handleDragOver(e, 'content')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'content', editorsRef.current.content)}
                                        onEditorReady={(editor) => handleEditorReady(editor, 'content')}
                                        readOnly={isSigned || isMobile || reportReadOnly}
                                        readOnlyLabel={reportReadOnly ? "Estudio en modo solo lectura" : (isMobile ? "Modo consulta móvil" : undefined)}
                                        showToolbar={false}
                                        autoGrow
                                        className="report-editor-rich-text h-full min-h-0 flex-1 resize-y overflow-auto"
                                    />
                                </div>
                            </div>

                            {/* Conclusión */}
                            <div
                                className="report-editor-body-section flex min-h-0 flex-col p-1"
                                onClick={(event) => handleEditorContainerClick(event, 'conclusion')}
                            >
                                <div className="flex min-h-0 flex-1 px-1">
                                    <RichTextEditor
                                        value={formData.conclusion}
                                        onChange={(value) => handleChange('conclusion', value)}
                                        placeholder="Conclusión del estudio..."
                                        dragOver={dragOverField === 'conclusion'}
                                        onDragOver={(e) => handleDragOver(e, 'conclusion')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'conclusion', editorsRef.current.conclusion)}
                                        onEditorReady={(editor) => handleEditorReady(editor, 'conclusion')}
                                        readOnly={isSigned || isMobile || reportReadOnly}
                                        readOnlyLabel={reportReadOnly ? "Estudio en modo solo lectura" : (isMobile ? "Modo consulta móvil" : undefined)}
                                        showToolbar={false}
                                        autoGrow
                                        className="report-editor-rich-text h-full min-h-0 flex-1 resize-y overflow-auto"
                                    />
                                </div>
                            </div>
                            </div>
                            <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#1e2430] md:hidden">
                                <summary className="min-h-11 cursor-pointer font-semibold text-gray-800 dark:text-gray-100">
                                    Información auxiliar
                                </summary>
                                <div className="mt-2 space-y-3 text-sm">
                                    <details className="rounded-md border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-[#151922]">
                                        <summary className="flex min-h-11 cursor-pointer items-center justify-between font-medium">
                                            <span>Estudios previos</span>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-[#28303d]">{patientStudies.length}</span>
                                        </summary>
                                        <div className="mt-2 space-y-2">
                                            {patientStudies.length === 0 ? (
                                                <p className="py-2 text-center text-xs text-muted-foreground">Sin estudios previos</p>
                                            ) : patientStudies.map((study) => (
                                                <div key={study.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="break-words text-xs font-medium">{study.estudio}</p>
                                                        <p className="text-xs text-muted-foreground">{'NextRIS'} · {study.modalidad} · {formatDate(study.fecha)}</p>
                                                    </div>
                                            {study.report_available ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleOpenHistoryReport(study)}
                                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-brand-purple hover:bg-brand-purple/10"
                                                            aria-label={`Ver informe previo de ${study.estudio}`}
                                                        >
                                                            <FileIcon className="h-5 w-5" />
                                                        </button>
                                                    ) : (
                                                        <span
                                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                                                            title="No hay informe"
                                                            aria-label="No hay informe"
                                                        >
                                                            <FileX className="h-5 w-5" strokeWidth={2.5} />
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                    <details className="rounded-md border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-[#151922]">
                                        <summary className="flex min-h-11 cursor-pointer items-center justify-between font-medium">
                                            <span>Imágenes adjuntas</span>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-[#28303d]">{images.length}</span>
                                        </summary>
                                        {images.length === 0 ? (
                                            <p className="py-2 text-center text-xs text-muted-foreground">Sin imágenes adjuntas</p>
                                        ) : (
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {images.map((image) => (
                                                    <figure key={image.id} className="min-w-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                                                        <img
                                                            src={image.url}
                                                            alt={image.name}
                                                            className="h-auto w-full object-cover"
                                                            onError={(event) => {
                                                                const fallbackUrl = getImageUrlByFilename(image.name);
                                                                if (event.currentTarget.src !== fallbackUrl) event.currentTarget.src = fallbackUrl;
                                                            }}
                                                        />
                                                        <figcaption className="break-words p-1.5 text-center text-[11px] text-muted-foreground">{image.name}</figcaption>
                                                    </figure>
                                                ))}
                                            </div>
                                        )}
                                    </details>
                                </div>
                            </details>
                        </div>

                        {/* Botón toggle derecho con animación */}
                        <div className="hidden self-stretch md:block">
                            {rightSidebarOpen ? (
                                <button
                                    onMouseDown={handleRightSidebarResizeStart}
                                    onClick={handleRightSidebarToggle}
                                    className="h-full cursor-col-resize rounded-md border border-gray-300 bg-gray-200 p-1.5 text-gray-700 transition-colors hover:bg-gray-300 dark:border-gray-700 dark:bg-[#1f2937] dark:text-gray-200 dark:hover:bg-[#2a3444]"
                                    title={`Clic para ocultar o mantén presionado y arrastra para ajustar el ancho (${rightSidebarTabLabel})`}
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
                            className={`relative hidden shrink-0 h-full origin-right overflow-hidden md:block ${isResizingRightSidebar ? '' : 'transition-opacity duration-200 ease-out'} ${rightSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
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
                                                    {patientStudies.map((study) => (
                                                        <div key={study.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e2430] px-3 py-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{study.estudio}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{'NextRIS'} · {study.modalidad} · {formatDate(study.fecha)}</p>
                                                            </div>
                                                            {study.report_available ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleOpenHistoryReport(study)}
                                                                    className="shrink-0 p-1 rounded hover:bg-brand-purple/10 dark:hover:bg-purple-800/30"
                                                                    title="Ver informe previo"
                                                                >
                                                                    <FileIcon className="w-4 h-4 text-brand-purple dark:text-purple-400" />
                                                                </button>
                                                            ) : (
                                                                <span
                                                                    className="inline-flex shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 p-1 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                                                                    title="No hay informe"
                                                                    aria-label="No hay informe"
                                                                >
                                                                    <FileX className="h-5 w-5" strokeWidth={2.5} />
                                                                </span>
                                                            )}
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

                <div className="mt-3 hidden shrink-0 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] dark:border-gray-700 dark:bg-[#151922] md:grid">
                    {canShare && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Compartir"
                                    title="Compartir"
                                    disabled={isLoading || !examId || isSigning || isSkipping}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-brand-purple bg-white text-brand-purple transition hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-transparent dark:text-purple-300"
                                >
                                    <Share2 className="h-5 w-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="top">
                                <DropdownMenuItem disabled={!shareStudyUid} onSelect={() => setShareKind('study')} className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    Estudio
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={!shareStudyUid || reportData.is_image === false} onSelect={() => setShareKind('images')} className="gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Imágenes
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <div className="col-start-2 row-start-1 flex flex-wrap items-center justify-center gap-3">
                        {canToggleReportSignature && <button
                            type="button"
                            onClick={handleSignAction}
                            disabled={isSigning || isSkipping || updateReportMutation.isPending || reportReadOnly}
                            aria-keyshortcuts="F1"
                            className="flex h-12 min-w-56 items-center justify-center gap-2 rounded-lg bg-brand-purple px-7 text-base font-bold text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-0.5 hover:bg-purple-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {isSigning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Signature className="h-5 w-5" />}
                            {isSigning ? 'FIRMANDO...' : (isSigned ? 'QUITAR FIRMA' : 'FIRMAR')}
                            <kbd className="rounded border border-white/30 bg-white/15 px-2 py-0.5 text-xs">F1</kbd>
                        </button>}

                        <button
                            type="button"
                            onClick={handleGuardarInforme}
                            disabled={updateReportMutation.isPending || isSigned || isSigning || isSkipping || reportReadOnly}
                            aria-keyshortcuts="F2"
                            className="flex h-10 min-w-36 items-center justify-center gap-2 rounded-md border border-brand-purple bg-white px-4 text-sm font-semibold text-brand-purple transition hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-transparent dark:text-purple-300"
                        >
                            {updateReportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {updateReportMutation.isPending ? 'GUARDANDO...' : 'GUARDAR'}
                            <kbd className="rounded border border-current/20 px-1.5 py-0.5 text-[10px]">F2</kbd>
                        </button>

                        <button
                            type="button"
                            onClick={handleSkipReport}
                            disabled={isSkipping || isSigning || updateReportMutation.isPending || reportReadOnly}
                            aria-keyshortcuts="F4"
                            className="flex h-10 min-w-36 items-center justify-center gap-2 rounded-md border border-amber-400 bg-amber-50 px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/40"
                        >
                            {isSkipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4" />}
                            {isSkipping ? 'SALTANDO...' : 'SALTAR'}
                            <kbd className="rounded border border-current/20 bg-white/60 px-1.5 py-0.5 text-[10px] dark:bg-black/20">F4</kbd>
                        </button>

                        <button
                            type="button"
                            onClick={() => void handleCloseWindow()}
                            disabled={isSkipping || isSigning}
                            aria-keyshortcuts="F8"
                            className="flex h-10 min-w-36 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                        >
                            <X className="h-4 w-4" />
                            CANCELAR
                            <kbd className="rounded border border-current/20 px-1.5 py-0.5 text-[10px]">F8</kbd>
                        </button>
                    </div>
                </div>
            </div>

            {canShare && shareKind && (
                <AdministrativeShareModal
                    key={`${examId}-${shareKind}`}
                    kind={shareKind}
                    examId={examId}
                    studyIuid={shareStudyUid}
                    patientName={patientName}
                    studyDescription={studyLabel}
                    onClose={() => setShareKind(null)}
                />
            )}

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
                requirePassword={requirePasswordForSigning}
            />

            {/* Modal de Selección de Plantilla */}
            <TemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => {
                    setIsTemplateModalOpen(false);
                    setSearchTerm('');
                    setOnlyStudyType(false);
                    setSelectedTemplate(null);
                }}
                searchTerm={searchTerm}
                setSearchTerm={(term) => {
                    setSearchTerm(term);
                    setSelectedTemplate(null);
                }}
                hasStudyType={Boolean(reportStudyTypeId)}
                onlyStudyType={onlyStudyType && Boolean(reportStudyTypeId)}
                setOnlyStudyType={(value) => {
                    setOnlyStudyType(value);
                    setSelectedTemplate(null);
                }}
                isLoading={isLoadingTemplates}
                hasError={templatesError}
                filteredTemplates={filteredTemplates}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                onAccept={() => {
                    if (selectedTemplate) {
                        const templateHasContent = [
                            selectedTemplate.study_reason,
                            selectedTemplate.content,
                            selectedTemplate.conclusion,
                        ].some(hasReportContent);

                        if (!templateHasContent) {
                            toast.warning('La plantilla seleccionada no contiene contenido para insertar');
                            return;
                        }

                        const hasChanges = formData.study_reason || formData.content || formData.conclusion;

                        if (hasChanges) {
                            setIsConfirmationModalOpen(true);
                        } else {
                            applyTemplateToReport(selectedTemplate);
                            setIsTemplateModalOpen(false);
                            setSelectedTemplate(null);
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
                        applyTemplateToReport(selectedTemplate);
                        setIsConfirmationModalOpen(false);
                        setIsTemplateModalOpen(false);
                        setSelectedTemplate(null);
                        toast.success('Plantilla aplicada exitosamente');
                    }
                }}
                title="Confirmar cambio de plantilla"
                message="Si cambia la plantilla, se perderán todos los cambios realizados en el informe. ¿Está seguro que desea continuar?"
                confirmText="Sí, cambiar plantilla"
                cancelText="No, mantener cambios"
                variant="warning"
            />

            <ConfirmationModal
                isOpen={isSkipConfirmationOpen}
                onClose={() => setIsSkipConfirmationOpen(false)}
                onConfirm={() => void executeSkipReport()}
                title="Saltar estudio"
                message="Hay cambios sin guardar en el informe. Si continúas, se descartarán y se abrirá el siguiente estudio disponible."
                confirmText="Sí, descartar y saltar"
                cancelText="Continuar editando"
                variant="warning"
                isLoading={isSkipping}
            />

            <ConfirmationModal
                isOpen={isWorkflowInfoModalOpen}
                onClose={() => setIsWorkflowInfoModalOpen(false)}
                onConfirm={() => setIsWorkflowInfoModalOpen(false)}
                title="Estudio cancelado"
                message="Este estudio fue cancelado y no puede redactarse, guardarse ni firmarse."
                confirmText="Entendido"
                cancelText="Cerrar"
                variant="danger"
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
