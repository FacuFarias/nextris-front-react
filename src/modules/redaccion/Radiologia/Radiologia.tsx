import { LocalReportDialog } from '@/components/LocalReportDialog';
import type { LocalReport } from '@/types/patientHistory';
import { hasAnyPermission } from "@/lib/permissions";
import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import { MainLayout } from "@/layouts/layout"
import { HandHelping, RefreshCcw, Loader2, SlidersHorizontal, X, UserCheck, Tags, Flag, FileText, Share2, Image } from "lucide-react"
import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { registerAssistantHandler } from "@/assistant/commands"
import type { AssistantCommand, AssistantResult } from "@/assistant/commands"
import { resolveAssistantModality } from "@/assistant/modality"
import { takeAssistantWorklist } from "@/assistant/worklistState"
import { useCreateFilterPreset, useUpdateFilterPreset } from "./hooks/use-filter-presets"
import { useIsMobile } from "@/hooks/use-mobile"
import { useInformes, useBlockExam, useUnblockExam, useUpdateFlags, useUpdateTagIds, useAllTags, useUpdateGeneralNotes, useDeleteExaminationNote, useAssignExam, useAssignExamBatch, useAddTagsBatch, useAddFlagsBatch, useConfirmStudy, useCancellationReasons, useCancelStudy } from "./hooks/use-informes"
import { useCrossWindowSync } from "./redactar-informe/hooks/use-cross-windows"
import { getInformesActions, getAdministrativeInformesActions, getFlagsColumn, getTagsColumn, getGeneralNotesAction, getPatientNameColumn, getSelectionColumn, getInformeColumns, informeColumns } from "./components/columns"
import TablaDynamic from "@/components/TableDynamic"
import type { Informes } from "./types/informes.types"
import type { FilterPreset, FilterPresetFilters } from "./types/filter-preset.types"
import { useDebounce } from "@uidotdev/usehooks"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ConfirmationModal } from "./components/ConfirmationModal"
import { AssignExamModal } from "./components/AssignExamModal"
import { MultiSelectActionsModal } from "./components/MultiSelectActionsModal"
import { ConfirmStudyModal } from "./components/ConfirmStudyModal"
import { CancelStudyModal } from "./components/CancelStudyModal"
import { FilterPresetTabs } from "./components/FilterPresetTabs"
import { AdministrativeShareModal } from "./components/AdministrativeShareModal"
import { Autocomplete } from "@/components/autocomplete"
import { useBodyParts } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo"
import { useModalidades } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades"
import { useGrupoEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/grupos-estudio"
import { modalidadesService } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades/services/modalidades.service"
import { ModalidadesKeys } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades/constants/query-keys"
import { bodyPartsService } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo/services/body-parts.service"
import { bodyPartsKeys } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo/constants/query-keys"
import { gruposEstudioService } from "@/modules/configuracion/configuracion-tablas/examenes/grupos-estudio/services/grupos-estudio.service"
import { gruposEstudioKeys } from "@/modules/configuracion/configuracion-tablas/examenes/grupos-estudio/constants/query-keys"
import { useFilterPresets } from "./hooks/use-filter-presets"
import { useAuth } from "@/context/AuthContext"
import { getDicomViewerUrl } from "@/services/dicomViewer"
import { cancelPreparedViewer, openStudyInViewer, prepareViewerWindow } from "@/services/viewerWindow"
import type { ViewerWindowTicket } from "@/services/viewerWindow"
import { getReportView, getInformes, putRedactarInforme, type ConfirmStudyPayload } from "./services/informes.service"
import { informesKeys } from "./constants/query-keys"
import { useTemplates } from "../informe-predefinidos/hooks/use-templates"
import type { Template } from "../informe-predefinidos/types/informe-pred.types"
import { TemplateModal } from "./components/modals"
import { MissingImageLinkModal } from "./components/MissingImageLinkModal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import fondoImage from "@/assets/redaccion.jpg"
import backDarkImage from "@/assets/back-dark.jpg";

const FIXED_COLUMN_KEYS = ["_selection"] as const;
const HIDDEN_COLUMN_KEYS = ["is_reported"] as const;
const XRAY_MODALITY_CODES = ["DX", "CR", "RX"] as const;
const DISPLAY_MODALITY_CODES: Record<string, string> = { RMN: "MR" };
const ASSISTANT_FILTER_STALE_MS = 5_000;
const ASSISTANT_SORT_COLUMNS = new Set([
    "patient_name", "patient_id", "patient_dni", "assignto_name", "study_type",
    "status", "admission_number", "accession_number", "created_on",
    "num_instances", "report_date", "template_name", "study_date", "arrival_time", "workflow_state",
]);

const normalizeVisibleColumns = (columnKeys: string[], fixedKeys: readonly string[] = FIXED_COLUMN_KEYS) => [
    ...Array.from(new Set(fixedKeys)),
    ...Array.from(new Set(columnKeys.filter((key) => (
        !fixedKeys.includes(key)
        && !HIDDEN_COLUMN_KEYS.includes(key as (typeof HIDDEN_COLUMN_KEYS)[number])
    )))),
];

const showViewerError = (error: unknown) => {
    const requestError = error as {
        response?: { status?: number; data?: { message?: string } };
    };
    const status = requestError.response?.status;

    if (status === 403) {
        toast.error('No tienes permisos para ver las imágenes de esta ubicación');
    } else if (status === 404) {
        toast.error('El examen no tiene imágenes asociadas');
    } else {
        toast.error(requestError.response?.data?.message || 'No se pudo abrir el visor DICOM');
    }
};

export const Radiologia = ({ administrativeView = false }: { administrativeView?: boolean }) => {
    const queryClient = useQueryClient();
    const isMobile = useIsMobile();
    const isAdministrativeView = administrativeView;
    // Hook para sincronizar entre ventanas
    useCrossWindowSync();

    const { authData } = useAuth();
    const user = authData?.user;
    const isAdmin = Boolean(
        user?.permissions?.includes("*")
        || user?.role_name?.toLowerCase() === "sysadmin"
        || user?.user_type?.toLowerCase() === "sysadmin"
    );
    const canLinkMissingImages = Boolean(
        (user?.permissions?.includes("*") || user?.permissions?.includes("worklist.link_missing_images"))
    );

    const [studioTypeId, setStudioTypeId] = useState<string | undefined>(undefined);
    const [bodyPartId, setBodyPartId] = useState<string | undefined>(undefined);
    const [modalityId, setModalityId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const [assistantPatientId, setAssistantPatientId] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [verFinalizados, setVerFinalizados] = useState(isAdministrativeView);
    const [asignadosAMi, setAsignadosAMi] = useState(false);
    const [listoParaLeer, setListoParaLeer] = useState(!isAdministrativeView);
    const [incluirSinFinalizar, setIncluirSinFinalizar] = useState(false);
    const [verSinImagenes, setVerSinImagenes] = useState(false);
    // Los estudios recibidos desde PACS pueden no tener todavía una orden CP.
    // Se muestran por defecto y el usuario puede ocultarlos desde el filtro.
    const [verSinOrden, setVerSinOrden] = useState(true);
    const [incluirCancelado, setIncluirCancelado] = useState(false);
    const [soloConNotas, setSoloConNotas] = useState(false);
    const [flagFilter, setFlagFilter] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<string>("all");
    const [dateField, setDateField] = useState<string>("admision");
    const [showFilters, setShowFilters] = useState(() => typeof window === "undefined" || window.innerWidth >= 768);
    const [siguientePaso, setSiguientePaso] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isNoImageModalOpen, setIsNoImageModalOpen] = useState(false);
    const [isConfirmStudyModalOpen, setIsConfirmStudyModalOpen] = useState(false);
    const [isCancelStudyModalOpen, setIsCancelStudyModalOpen] = useState(false);
    const [externalReport, setExternalReport] = useState<LocalReport | null>(null);
    const [openingReport, setOpeningReport] = useState(false);
    const openingReportRef = useRef(false);
    const [selectedExamForConfirm, setSelectedExamForConfirm] = useState<Informes | null>(null);
    const [selectedInforme, setSelectedInforme] = useState<Informes | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        normalizeVisibleColumns(
            isAdministrativeView
                ? ["patient_name", "patient_id", "patient_dni", "study_type", "template_name", "status", "workflow_state", "created_on", "study_date", "arrival_time", "flags"]
                : ["patient_name", "patient_id", "patient_dni", "assignto_name", "study_type", "template_name", "status", "accession_number", "workflow_state", "created_on", "study_date", "arrival_time", "num_instances"],
            isAdministrativeView ? [] : FIXED_COLUMN_KEYS,
        )
    );
    const [sortColumn, setSortColumn] = useState("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const presetsInitializedRef = useRef(false);
    const [shareModal, setShareModal] = useState<{ kind: "images" | "study"; informe: Informes } | null>(null);
    const [missingImageStudy, setMissingImageStudy] = useState<Informes | null>(null);
    const fixedColumnKeys = useMemo<string[]>(() => isAdministrativeView ? [] : [...FIXED_COLUMN_KEYS], [isAdministrativeView]);

    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const debouncedColumnFilters = useDebounce(columnFilters, 500);
    const useDebounceSearch = useDebounce(searchTerm, 500);
    const [assistantSearchOverride, setAssistantSearchOverride] = useState<string | null>(null);
    const worklistSearch = assistantSearchOverride ?? useDebounceSearch;
    useEffect(() => {
        if (assistantPatientId && searchTerm !== assistantPatientId) setAssistantPatientId("");
    }, [assistantPatientId, searchTerm]);
    useEffect(() => {
        if (assistantSearchOverride !== null && (searchTerm !== assistantSearchOverride || useDebounceSearch === assistantSearchOverride)) {
            setAssistantSearchOverride(null);
        }
    }, [assistantSearchOverride, searchTerm, useDebounceSearch]);
    const { mutateAsync: blockExam } = useBlockExam();
    const { mutateAsync: unblockExam } = useUnblockExam();
    const { mutate: updateFlags, isPending: isUpdatingFlags } = useUpdateFlags();
    const { mutate: updateTagIds, isPending: isUpdatingTagIds } = useUpdateTagIds();
    const { allTags } = useAllTags();
    const { mutate: updateGeneralNotes, isPending: isUpdatingNotes } = useUpdateGeneralNotes();
    const { mutate: deleteExaminationNote, isPending: isDeletingNote } = useDeleteExaminationNote();
    const { informesData, isLoading: isLoadingInformes, isFetching: isFetchingInformes, error: informesError, refetchInformes } = useInformes({ page, per_page: perPage, search: worklistSearch, column_filters: debouncedColumnFilters, patient_id_exact: assistantPatientId, show_reported: isAdministrativeView ? true : verFinalizados, show_ready: isAdministrativeView ? incluirSinFinalizar : listoParaLeer, assigned_to_me: isAdministrativeView ? false : asignadosAMi, show_no_image: verSinImagenes, show_without_order: verSinOrden, show_only_with_notes: soloConNotas, show_cancelled: incluirCancelado, bodypart_id: isAdministrativeView ? "" : bodyPartId, modality_id: modalityId, study_group_id: isAdministrativeView ? "" : studioTypeId, flag_filter: flagFilter.join(','), date_range: dateRange, date_field: dateField, sort_column: sortColumn, sort_direction: sortDirection });
    const { gruposEstudio } = useGrupoEstudio();
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();
    const { presets, isLoading: isLoadingPresets } = useFilterPresets();
    const { mutateAsync: createAssistantPreset } = useCreateFilterPreset();
    const { mutateAsync: updateAssistantPreset } = useUpdateFilterPreset();

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedExamForAssign, setSelectedExamForAssign] = useState<Informes | null>(null);
    const { mutateAsync: assignExam } = useAssignExam();
    const { mutateAsync: confirmStudy } = useConfirmStudy();
    const { data: cancellationReasonsResponse } = useCancellationReasons(isConfirmStudyModalOpen || isCancelStudyModalOpen);
    const { mutateAsync: cancelStudy, isPending: isCancellingStudy } = useCancelStudy();
    const { mutateAsync: assignExamBatch } = useAssignExamBatch();
    const { mutateAsync: addTagsBatch } = useAddTagsBatch();
    const { mutateAsync: addFlagsBatch } = useAddFlagsBatch();

    const canAssign = authData?.user?.permissions?.includes('*')
        || authData?.user?.permissions?.includes('reports.assign')
        || false;
    const canWrite = authData?.user?.permissions?.includes('*')
        || authData?.user?.permissions?.includes('reports.write')
        || false;
    const canConfirmExecute = authData?.user?.permissions?.includes('*')
        || authData?.user?.permissions?.includes('worklist.confirm_execute')
        || false;
    const canDeleteNotes = authData?.user?.permissions?.includes('*')
        || authData?.user?.permissions?.includes('reports.notes.delete')
        || false;

    const [selectedStudyIds, setSelectedStudyIds] = useState<Set<string>>(new Set());
    const assistantSelectionRef = useRef(selectedStudyIds);
    const assistantColumnsRef = useRef(visibleColumns);
    const assistantSortRef = useRef({ column: sortColumn, direction: sortDirection });
    const assistantRowsRef = useRef<{ rows: Informes[]; total: number; page: number }>({ rows: [], total: 0, page: 1 });
    useEffect(() => { assistantSelectionRef.current = selectedStudyIds; }, [selectedStudyIds]);
    useEffect(() => { assistantColumnsRef.current = visibleColumns; }, [visibleColumns]);
    useEffect(() => { assistantSortRef.current = { column: sortColumn, direction: sortDirection }; }, [sortColumn, sortDirection]);
    useEffect(() => {
        if (informesData?.data?.data) assistantRowsRef.current = {
            rows: informesData.data.data, total: Number(informesData.data.total || 0), page,
        };
    }, [informesData, page]);
    const [multiSelectAction, setMultiSelectAction] = useState<'assign' | 'tags' | 'flags' | null>(null);
    const [contextMenu, setContextMenu] = useState<{ row: Informes; x: number; y: number } | null>(null);
    const canViewImages = hasAnyPermission(user?.permissions, ["images.view"]);
    const canShareWorklist = hasAnyPermission(user?.permissions, ["worklist.share"]);
    const canShareImages = hasAnyPermission(user?.permissions, ["images.share_link"]);
    const [isContextTemplateModalOpen, setIsContextTemplateModalOpen] = useState(false);
    const [contextTemplateRow, setContextTemplateRow] = useState<Informes | null>(null);
    const [contextTemplateSearchTerm, setContextTemplateSearchTerm] = useState("");
    const [contextOnlyStudyType, setContextOnlyStudyType] = useState(false);
    const [selectedContextTemplate, setSelectedContextTemplate] = useState<Template | null>(null);
    const [pendingTemplateChange, setPendingTemplateChange] = useState<{ row: Informes; template: Template } | null>(null);
    const [pendingAssistantReport, setPendingAssistantReport] = useState<Informes | null>(null);
    const assistantEditorWindow = useRef<Window | null>(null);
    const assistantEditorStudyId = useRef<string | null>(null);
    const [isChangingTemplate, setIsChangingTemplate] = useState(false);

    const contextStudyTypeId = contextTemplateRow?.study_type_id?.trim() || undefined;
    const { data: contextTemplates, isLoading: isLoadingContextTemplates, isError: contextTemplatesError } = useTemplates(
        contextOnlyStudyType && contextStudyTypeId ? contextStudyTypeId : undefined,
        undefined,
        undefined,
        'simple',
        Boolean(isContextTemplateModalOpen && contextTemplateRow && !isAdministrativeView),
    );
    const contextTemplateOptions = contextTemplates?.data || [];
    const filteredContextTemplates = contextTemplateOptions.filter((template) => {
        const search = contextTemplateSearchTerm.trim().toLowerCase();
        return !search
            || template.title.toLowerCase().includes(search)
            || template.study_type_description?.toLowerCase().includes(search);
    });

    useEffect(() => {
        if (!contextMenu) return;

        const closeOnScroll = (event: Event) => {
            if (event.target instanceof Element && event.target.closest('[role="menu"]')) return;
            setContextMenu(null);
        };
        const closeOnResize = () => setContextMenu(null);

        window.addEventListener('scroll', closeOnScroll, true);
        window.addEventListener('resize', closeOnResize);
        return () => {
            window.removeEventListener('scroll', closeOnScroll, true);
            window.removeEventListener('resize', closeOnResize);
        };
    }, [contextMenu]);

    const handleAssignExam = useCallback((informe: Informes) => {
        setSelectedExamForAssign(informe);
        setIsAssignModalOpen(true);
    }, []);

    const handleConfirmAssign = useCallback(async (userId: string) => {
        if (!selectedExamForAssign) return;
        await assignExam({ examId: selectedExamForAssign.guid, userId });
    }, [selectedExamForAssign, assignExam]);

    const handleOpenConfirmStudy = useCallback((informe: Informes) => {
        setSelectedExamForConfirm(informe);
        setIsConfirmStudyModalOpen(true);
    }, []);

    const handleConfirmStudy = useCallback(async (data: ConfirmStudyPayload) => {
        if (!selectedExamForConfirm) return;
        await confirmStudy({ examId: selectedExamForConfirm.guid, data });
        setIsConfirmStudyModalOpen(false);
        setSelectedExamForConfirm(null);
    }, [confirmStudy, selectedExamForConfirm]);

    const handleOpenCancelStudy = useCallback(() => {
        setIsConfirmStudyModalOpen(false);
        setIsCancelStudyModalOpen(true);
    }, []);

    const handleCancelStudy = useCallback(async (reasonCode: string, detail?: string) => {
        if (!selectedExamForConfirm) return;
        await cancelStudy({ examId: selectedExamForConfirm.guid, reasonCode, detail });
        setIsCancelStudyModalOpen(false);
        setSelectedExamForConfirm(null);
    }, [cancelStudy, selectedExamForConfirm]);


    const closeConfirmStudyModal = useCallback(() => {
        setIsConfirmStudyModalOpen(false);
        setSelectedExamForConfirm(null);
    }, []);

    const handleMultiSelectAssign = useCallback(async (userId: string) => {
        const ids = Array.from(selectedStudyIds);
        await assignExamBatch({ examIds: ids, userId });
        setSelectedStudyIds(new Set());
    }, [selectedStudyIds, assignExamBatch]);

    const handleMultiSelectAddTags = useCallback(async (tagIds: string[]) => {
        const ids = Array.from(selectedStudyIds);
        await addTagsBatch({ examIds: ids, tagIds });
        setSelectedStudyIds(new Set());
    }, [selectedStudyIds, addTagsBatch]);

    const handleMultiSelectAddFlags = useCallback(async (flags: string[]) => {
        const ids = Array.from(selectedStudyIds);
        await addFlagsBatch({ examIds: ids, flags });
        setSelectedStudyIds(new Set());
    }, [selectedStudyIds, addFlagsBatch]);

    const toggleStudySelection = useCallback((studyId: string) => {
        setSelectedStudyIds(prev => {
            const next = new Set(prev);
            if (next.has(studyId)) {
                next.delete(studyId);
            } else {
                next.add(studyId);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        const currentData = informesData?.data?.data || [];
        if (selectedStudyIds.size === currentData.length) {
            setSelectedStudyIds(new Set());
        } else {
            setSelectedStudyIds(new Set(currentData.map((s: Informes) => s.guid)));
        }
    }, [selectedStudyIds.size, informesData]);

    const clearSelection = useCallback(() => {
        setSelectedStudyIds(new Set());
    }, []);

    const handleRowContextMenu = useCallback((row: Informes, _index: number, event: React.MouseEvent) => {
        if (isAdministrativeView) return;

        event.preventDefault();
        event.stopPropagation();
        setSelectedStudyIds(new Set([row.guid]));
        setContextMenu({
            row,
            x: event.clientX,
            y: event.clientY,
        });
    }, [isAdministrativeView]);

    const handleContextAction = useCallback((action: 'assign' | 'tags' | 'flags' | 'template') => {
        const row = contextMenu?.row;
        if (!row) return;

        setSelectedStudyIds(new Set([row.guid]));
        setContextMenu(null);

        if (action === 'assign') {
            handleAssignExam(row);
        } else if (action === 'template') {
            setContextTemplateRow(row);
            setContextTemplateSearchTerm('');
            setContextOnlyStudyType(false);
            setSelectedContextTemplate(null);
            setIsContextTemplateModalOpen(true);
        } else {
            setMultiSelectAction(action);
        }
    }, [contextMenu, handleAssignExam]);

    const handleApplyContextTemplate = useCallback(async () => {
        if (!pendingTemplateChange) return;

        const { row, template } = pendingTemplateChange;
        setIsChangingTemplate(true);
        try {
            await putRedactarInforme(row.guid, {
                study_reason: template.study_reason || '',
                content: template.content || template.findings || '',
                conclusion: template.conclusion || '',
                template_id: template.guid,
                mark_as_reported: false,
            });
            toast.success('Plantilla cambiada exitosamente');
            await refetchInformes();
        } catch (error) {
            const requestError = error as { response?: { data?: { message?: string } } };
            toast.error(requestError.response?.data?.message || 'No se pudo cambiar la plantilla');
        } finally {
            setIsChangingTemplate(false);
            setPendingTemplateChange(null);
            setContextTemplateRow(null);
            setSelectedContextTemplate(null);
        }
    }, [pendingTemplateChange, refetchInformes]);

    // Función para toggle de columnas
    const toggleColumn = useCallback((columnKey: string) => {
        if (fixedColumnKeys.includes(columnKey)) return;

        setVisibleColumns(prev => {
            if (prev.includes(columnKey)) {
                // No permitir que se desmarquen todas las columnas
                if (prev.length === 1) {
                    toast.error('Debe mantener al menos una columna visible');
                    return prev;
                }
                return prev.filter(key => key !== columnKey);
            } else {
                return [...prev, columnKey];
            }
        });
    }, [fixedColumnKeys]);

    const handleColumnOrderChange = useCallback((columnKeys: string[]) => {
        setVisibleColumns(normalizeVisibleColumns(columnKeys, fixedColumnKeys));
    }, [fixedColumnKeys]);

    const handleUpdateFlags = useCallback((examId: string, flags: string[]) => {
        updateFlags({ examId, flags });
    }, [updateFlags]);

    const handleUpdateTagIds = useCallback((examId: string, tagIds: string[]) => {
        updateTagIds({ examId, tagIds });
    }, [updateTagIds]);

    const handleUpdateGeneralNotes = useCallback((examId: string, notes: string) => {
        updateGeneralNotes({ examId, notes });
    }, [updateGeneralNotes]);

    const handleDeleteNote = useCallback((examId: string, noteId: string) => {
        deleteExaminationNote({ examId, noteId });
    }, [deleteExaminationNote]);

    const handleAdminUnlock = useCallback(async (examId: string) => {
        try {
            await unblockExam(examId);
            toast.success('Examen desbloqueado');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al desbloquear el examen');
        }
    }, [unblockExam]);

    const patientNameColumn = useMemo(
        () => getPatientNameColumn(),
        []
    );

    // Columna de banderas generada con el handler actual
    const flagsColumn = useMemo(
        () => getFlagsColumn(handleUpdateFlags, isUpdatingFlags),
        [handleUpdateFlags, isUpdatingFlags]
    );

    // Columna de tags generada con handler y lista de tags disponibles
    const tagsColumn = useMemo(
        () => getTagsColumn(allTags, handleUpdateTagIds, isUpdatingTagIds),
        [allTags, handleUpdateTagIds, isUpdatingTagIds]
    );

    // Columna de selección múltiple
    const selectionColumn = useMemo(
        () => getSelectionColumn(selectedStudyIds, toggleStudySelection, toggleSelectAll, informesData?.data?.data?.length || 0),
        [selectedStudyIds, toggleStudySelection, toggleSelectAll, informesData]
    );

    const handleOpenMissingImageModal = useCallback((informe: Informes) => {
        setMissingImageStudy(informe);
    }, []);

    const missingImageColumns = useMemo(
        () => getInformeColumns(canLinkMissingImages ? handleOpenMissingImageModal : undefined),
        [canLinkMissingImages, handleOpenMissingImageModal],
    );

    // Todas las columnas disponibles (selección + paciente + estáticas + banderas + tags)
    const allColumns = useMemo(
        () => (isAdministrativeView
            ? [patientNameColumn, ...missingImageColumns, flagsColumn, tagsColumn]
            : [selectionColumn, patientNameColumn, ...missingImageColumns, flagsColumn, tagsColumn]
        ).filter((column) => column.key !== "is_reported"),
        [isAdministrativeView, selectionColumn, patientNameColumn, missingImageColumns, flagsColumn, tagsColumn],
    );

    // Columnas visibles (incluye banderas si está en la lista)
    const filteredColumns = useMemo(
        () => visibleColumns.map(key => allColumns.find(col => col.key === key)).filter((col): col is typeof allColumns[number] => Boolean(col)),
        [allColumns, visibleColumns]
    );

    // Función para obtener los filtros actuales como objeto
    const getCurrentFilters = useCallback((): FilterPresetFilters => ({
        search: searchTerm,
        listo_para_leer: isAdministrativeView ? incluirSinFinalizar : listoParaLeer,
        ver_finalizados: isAdministrativeView ? true : verFinalizados,
        asignados_a_mi: isAdministrativeView ? false : asignadosAMi,
        ver_sin_imagenes: verSinImagenes,
        ver_sin_orden: verSinOrden,
        incluir_cancelado: incluirCancelado,
        study_group_id: isAdministrativeView ? "" : studioTypeId || "",
        modality_id: modalityId || "",
        bodypart_id: isAdministrativeView ? "" : bodyPartId || "",
        visible_columns: visibleColumns,
        per_page: perPage,
        sort_column: sortColumn,
        sort_direction: sortDirection,
        date_range: dateRange,
        date_field: dateField,
        flag_filter: flagFilter.join(','),
        filters_visible: showFilters,
    }), [isAdministrativeView, searchTerm, listoParaLeer, incluirSinFinalizar, verFinalizados, asignadosAMi, verSinImagenes, verSinOrden, incluirCancelado, studioTypeId, modalityId, bodyPartId, visibleColumns, perPage, sortColumn, sortDirection, dateRange, dateField, flagFilter, showFilters]);

    // Función para aplicar filtros de un preset
    const applyPreset = useCallback((preset: FilterPreset | null) => {
        if (!preset) {
            // Reset a defaults (tab "Todos")
            setSearchTerm("");
            setListoParaLeer(true);
            setVerFinalizados(false);
            setAsignadosAMi(false);
            setVerSinImagenes(false);
            setVerSinOrden(true);
            setIncluirCancelado(false);
            setStudioTypeId(undefined);
            setModalityId(undefined);
            setBodyPartId(undefined);
            setVisibleColumns(normalizeVisibleColumns(informeColumns.map(col => col.key as string)));
            setPerPage(10);
            setSortColumn("");
            setSortDirection("asc");
            setDateRange("all");
            setDateField("admision");
            setFlagFilter([]);
            setShowFilters(true);
            setActivePresetId(null);
        } else {
            const f = preset.filters;
            setSearchTerm(f.search || "");
            setListoParaLeer(f.listo_para_leer ?? true);
            setVerFinalizados(f.ver_finalizados ?? false);
            setAsignadosAMi(f.asignados_a_mi ?? false);
            setVerSinImagenes(f.ver_sin_imagenes ?? false);
            setVerSinOrden(f.ver_sin_orden ?? false);
            setIncluirCancelado(f.incluir_cancelado ?? false);
            setStudioTypeId(f.study_group_id || undefined);
            setModalityId(f.modality_id || undefined);
            setBodyPartId(f.bodypart_id || undefined);
            const cols = f.visible_columns?.length ? f.visible_columns : informeColumns.map(col => col.key as string);
            setVisibleColumns(normalizeVisibleColumns(cols));
            setPerPage(f.per_page || 10);
            setSortColumn(f.sort_column || "");
            setSortDirection(f.sort_direction || "asc");
            setDateRange(f.date_range || "all");
            setDateField(f.date_field || "admision");
            setFlagFilter(f.flag_filter ? f.flag_filter.split(',').filter(Boolean) : []);
            setShowFilters(f.filters_visible ?? true);
            setActivePresetId(preset.guid);
        }
        setPage(1);
    }, []);

    // Inicializar con el preset activo al cargar
    useEffect(() => {
        if (!isAdministrativeView && !isLoadingPresets && !presetsInitializedRef.current) {
            presetsInitializedRef.current = true;
            const remembered = takeAssistantWorklist();
            if (remembered) {
                setSearchTerm(remembered.search);
                setVerFinalizados(remembered.reported);
                setListoParaLeer(remembered.ready);
                setAsignadosAMi(remembered.assigned);
                setVerSinImagenes(remembered.noImage);
                setVerSinOrden(remembered.withoutOrder);
                setSoloConNotas(remembered.onlyNotes);
                setModalityId(remembered.modality);
                setBodyPartId(remembered.bodyPart);
                setStudioTypeId(remembered.studyGroup);
                setFlagFilter(remembered.flags);
                setDateRange(remembered.dateRange);
                setDateField(remembered.dateField);
                setPage(remembered.page);
                setActivePresetId(null);
                return;
            }
            const activePreset = presets.find(p => p.is_active);
            if (activePreset) {
                applyPreset(activePreset);
            }
        }
    }, [isAdministrativeView, isLoadingPresets, presets, applyPreset]);

    useEffect(() => {
        if (isMobile) setShowFilters(false);
    }, [isMobile]);

    // Handler para cambio de preset desde las tabs
    const handlePresetChange = useCallback((preset: FilterPreset | null) => {
        applyPreset(preset);
    }, [applyPreset]);

    const handleSortChange = useCallback((column: string, direction: "asc" | "desc") => {
        setSortColumn(column);
        setSortDirection(direction);
        setPage(1);
    }, []);

    // Listener para eventos de actualización del visor
    useEffect(() => {
        const CHANNEL_NAME = 'informe-updates';
        const channel = new BroadcastChannel(CHANNEL_NAME);

        const handleViewerUpdate = async (event: MessageEvent) => {
            const { type, guid, studyInstanceUid } = event.data || {};
            if (type !== 'VIEWER_UPDATE' || !guid || !studyInstanceUid || !authData?.user?.id) return;

            const viewerTicket = prepareViewerWindow();
            if (!viewerTicket) {
                toast.error('Por favor, permite popups para abrir el visor DICOM');
                return;
            }

            try {
                const data = await getDicomViewerUrl(authData.user.id, guid);
                await openStudyInViewer(viewerTicket, {
                    studyInstanceUID: data.study_uid,
                    viewerUrl: data.viewer_url,
                });
            } catch (error: unknown) {
                cancelPreparedViewer(viewerTicket);
                showViewerError(error);
            }
        };

        channel.addEventListener('message', handleViewerUpdate);

        return () => {
            channel.removeEventListener('message', handleViewerUpdate);
            channel.close();
        };
    }, [authData?.user?.id]);

    const pagination = {
        page: informesData?.data?.page || 1,
        pageSize: informesData?.data?.per_page || perPage,
        total: informesData?.data?.total || 0,
    };

    const handleRedactarInforme = async (informe: Informes) => {
        if (informe.workflow_state === 'cancelled') {
            toast.error('El estudio está cancelado y no puede redactarse');
            return;
        }
        // Verificar si el informe está bloqueado por otro usuario
        if (informe.blocked_by) {
            const blockerLabel = informe.blocked_by_name || 'otro usuario';
            toast.error(`Este informe está siendo editado por ${blockerLabel}`);
            return;
        }

        // Verificar si el informe no tiene imágenes y no está reportado
        if (!informe.is_reported && !informe.is_image) {
            setSelectedInforme(informe);
            setIsNoImageModalOpen(true);
            return;
        }

        if (informe.is_reported) {
            // Si el informe ya está reportado, mostrar modal de confirmación
            setSelectedInforme(informe);
            setIsConfirmationModalOpen(true);
        } else {
            // Si no está reportado, bloquear y abrir directamente
            await blockAndOpenReport(informe);
        }
    };

    // Commands are executed inside this tab, using the same React state as the visible worklist.
    useEffect(() => {
        if (isAdministrativeView || user?.user_type?.toLowerCase() !== 'sysadmin') return;
        return registerAssistantHandler('worklist', async (command: AssistantCommand): Promise<AssistantResult> => {
            const total = assistantRowsRef.current.total;
            const context = (): AssistantResult => ({
                status: isLoadingInformes ? 'loading' : 'ok', view: 'worklist', total,
                selectedCount: assistantSelectionRef.current.size, reported: verFinalizados,
                ready: listoParaLeer, assignedToMe: asignadosAMi,
                dateRange, modality: modalityId ? 'filtered' : 'all',
                page: assistantRowsRef.current.page, pageSize: perPage,
                visibleCount: assistantRowsRef.current.rows.length,
                sortColumn: assistantSortRef.current.column,
                sortDirection: assistantSortRef.current.direction,
            });
            if (command.kind === 'context' || command.kind === 'worklist') return context();
            if (command.kind === 'layout') return {
                ...context(), availableColumns: allColumns.map(column => String(column.key)),
                visibleColumns: assistantColumnsRef.current,
            };
            if (command.kind === 'layout_set') {
                const args = command.args;
                const available = new Set(allColumns.map(column => String(column.key)));
                const show = Array.isArray(args.show) ? args.show : [];
                const hide = Array.isArray(args.hide) ? args.hide : [];
                const order = Array.isArray(args.order) ? args.order : [];
                const keys = [...show, ...hide, ...order];
                if (keys.some(key => typeof key !== 'string' || !available.has(key))
                    || hide.some(key => fixedColumnKeys.includes(key))
                    || show.some(key => hide.includes(key))
                    || new Set(order).size !== order.length) return { status: 'invalid_column' };
                let next = assistantColumnsRef.current.filter(key => !hide.includes(key));
                for (const key of show) if (!next.includes(key)) next.push(key);
                if (order.some(key => !next.includes(key))) return { status: 'column_not_visible' };
                if (order.length) next = [...order.filter(key => next.includes(key)), ...next.filter(key => !order.includes(key))];
                next = normalizeVisibleColumns(next, fixedColumnKeys);
                if (!next.some(key => !fixedColumnKeys.includes(key))) return { status: 'invalid_layout' };
                assistantColumnsRef.current = next;
                setVisibleColumns(next);
                return { status: 'ok', view: 'worklist', visibleColumns: next };
            }
            if (command.kind === 'layout_save') {
                const name = typeof command.args.name === 'string' ? command.args.name.trim() : '';
                if (!name && !activePresetId) return { status: 'name_required' };
                try {
                    if (name) {
                        const response = await createAssistantPreset({ name, filters: {
                            ...getCurrentFilters(), visible_columns: assistantColumnsRef.current,
                            sort_column: assistantSortRef.current.column, sort_direction: assistantSortRef.current.direction,
                        } });
                        if (response?.data?.guid) setActivePresetId(response.data.guid);
                    } else {
                        await updateAssistantPreset({ guid: activePresetId!, data: { filters: {
                            ...getCurrentFilters(), visible_columns: assistantColumnsRef.current,
                            sort_column: assistantSortRef.current.column, sort_direction: assistantSortRef.current.direction,
                        } } });
                    }
                    return { status: 'ok', view: 'worklist' };
                } catch { return { status: 'error' }; }
            }
            if (command.kind === 'select') {
                if (isLoadingInformes || isFetchingInformes) return { status: 'loading' };
                const rows = assistantRowsRef.current.rows;
                const positions = Array.isArray(command.args.positions) ? command.args.positions : [];
                const mode = command.args.mode || 'replace';
                if (positions.some(position => !Number.isInteger(position) || position < 1 || position > rows.length))
                    return { status: 'position_out_of_range', page: assistantRowsRef.current.page, visibleCount: rows.length, total };
                const ids = positions.map(position => rows[position - 1].guid);
                const next = mode === 'replace' || mode === 'clear' ? new Set<string>() : new Set(assistantSelectionRef.current);
                for (const id of ids) {
                    if (mode === 'remove') next.delete(id);
                    else if (mode !== 'clear') next.add(id);
                }
                assistantSelectionRef.current = next;
                setSelectedStudyIds(next);
                return { status: 'ok', view: 'worklist', selectedCount: next.size, page: assistantRowsRef.current.page };
            }
            if (command.kind === 'sort') {
                const column = command.args.column;
                const direction = command.args.direction;
                if (typeof column !== 'string' || !ASSISTANT_SORT_COLUMNS.has(column)
                    || !allColumns.some(item => item.key === column && item.sortable !== false)
                    || (direction !== 'asc' && direction !== 'desc')) return { status: 'invalid_sort' };
                const params = {
                    page: 1, per_page: perPage, search: worklistSearch, patient_id_exact: assistantPatientId,
                    show_reported: verFinalizados, show_ready: listoParaLeer, assigned_to_me: asignadosAMi,
                    show_no_image: verSinImagenes, show_without_order: verSinOrden, show_only_with_notes: soloConNotas, show_cancelled: incluirCancelado,
                    modality_id: modalityId || '', bodypart_id: bodyPartId || '', study_group_id: studioTypeId || '',
                    flag_filter: flagFilter.join(','), date_range: dateRange, date_field: dateField,
                    sort_column: column, sort_direction: direction,
                };
                try {
                    const result = await queryClient.fetchQuery({
                        queryKey: informesKeys.list(params.page, params.per_page, params.search, params.show_reported,
                            params.show_ready, params.assigned_to_me, params.show_no_image, params.show_without_order,
                            params.bodypart_id, params.modality_id, params.study_group_id, params.flag_filter,
                            params.date_range, params.date_field, params.sort_column, params.sort_direction,
                            params.show_only_with_notes, params.patient_id_exact),
                        queryFn: () => getInformes(params), staleTime: ASSISTANT_FILTER_STALE_MS,
                    });
                    assistantRowsRef.current = { rows: result?.data?.data || [], total: Number(result?.data?.total || 0), page: 1 };
                    assistantSortRef.current = { column, direction };
                    setSortColumn(column);
                    setSortDirection(direction);
                    setPage(1);
                    return { status: 'ok', view: 'worklist', total: Number(result?.data?.total || 0),
                        page: 1, pageSize: perPage, visibleCount: result?.data?.data?.length || 0,
                        sortColumn: column, sortDirection: direction };
                } catch { return { status: 'error' }; }
            }
            if (command.kind === 'filter' || command.kind === 'reports') {
                const args = command.args;
                let modalityCatalog = modalidades;
                let bodyPartCatalog = bodyParts;
                let studyGroupCatalog = gruposEstudio;
                try {
                    await Promise.all([
                        args.modality && !Array.isArray(modalityCatalog?.data)
                            ? queryClient.fetchQuery({ queryKey: [ModalidadesKeys.all], queryFn: modalidadesService.getAll, staleTime: 600_000 }).then(data => { modalityCatalog = data; })
                            : Promise.resolve(),
                        args.bodyPart && !Array.isArray(bodyPartCatalog?.data)
                            ? queryClient.fetchQuery({ queryKey: bodyPartsKeys.all, queryFn: bodyPartsService.getAll, staleTime: 600_000 }).then(data => { bodyPartCatalog = data; })
                            : Promise.resolve(),
                        args.studyGroup && !Array.isArray(studyGroupCatalog?.data)
                            ? queryClient.fetchQuery({ queryKey: gruposEstudioKeys.all, queryFn: gruposEstudioService.getAll, staleTime: 600_000 }).then(data => { studyGroupCatalog = data; })
                            : Promise.resolve(),
                    ]);
                } catch { return { status: 'error' }; }
                const reset = args.reset === true;
                const nextPatientId = typeof args.patientId === 'string' ? args.patientId.trim()
                    : reset || typeof args.search === 'string' ? '' : assistantPatientId;
                if (nextPatientId && (nextPatientId.length > 200 || Array.from(nextPatientId).some(char => {
                    const code = char.codePointAt(0) || 0;
                    return code < 32 || code === 127 || code === 0xFFFD;
                })))
                    return { status: 'invalid_filter' };
                const nextSearch = nextPatientId || (typeof args.search === 'string' ? args.search : reset ? '' : searchTerm);
                const nextReported = command.kind === 'reports' ? true : typeof args.reported === 'boolean' ? args.reported : reset ? false : verFinalizados;
                const nextReady = command.kind === 'reports' ? false : typeof args.ready === 'boolean' ? args.ready : reset ? true : listoParaLeer;
                const nextAssigned = typeof args.assignedToMe === 'boolean' ? args.assignedToMe : reset ? false : asignadosAMi;
                const nextDate = typeof args.dateRange === 'string' ? args.dateRange : reset ? 'all' : dateRange;
                const nextDateField = args.dateField === 'reporte' || args.dateField === 'admision' ? args.dateField : reset ? 'admision' : dateField;
                const nextNoImage = typeof args.showNoImage === 'boolean' ? args.showNoImage : reset ? false : verSinImagenes;
                const nextWithoutOrder = typeof args.showWithoutOrder === 'boolean' ? args.showWithoutOrder : reset ? true : verSinOrden;
                const nextOnlyNotes = typeof args.onlyWithNotes === 'boolean' ? args.onlyWithNotes : reset ? false : soloConNotas;
                let nextModality = reset ? '' : modalityId || '';
                let nextBodyPart = reset ? '' : bodyPartId || '';
                let nextStudyGroup = reset ? '' : studioTypeId || '';
                if (typeof args.modality === 'string') {
                    if (!args.modality.trim()) nextModality = '';
                    else {
                        const choices = Array.isArray(modalityCatalog?.data) ? modalityCatalog.data : [];
                        const found = resolveAssistantModality(args.modality, choices);
                        if (!found) return { status: 'invalid_filter' };
                        nextModality = found;
                    }
                }
                if (typeof args.bodyPart === 'string') {
                    if (!args.bodyPart.trim()) nextBodyPart = '';
                    else {
                        const wanted = args.bodyPart.trim().toLowerCase();
                        const choices = Array.isArray(bodyPartCatalog?.data) ? bodyPartCatalog.data : [];
                        const found = choices.find(option => String(option.description || '').toLowerCase() === wanted)
                            || choices.find(option => String(option.description || '').toLowerCase().includes(wanted));
                        if (!found) return { status: 'invalid_filter' };
                        nextBodyPart = found.guid;
                    }
                }
                if (typeof args.studyGroup === 'string') {
                    if (!args.studyGroup.trim()) nextStudyGroup = '';
                    else {
                        const wanted = args.studyGroup.trim().toLowerCase();
                        const choices = Array.isArray(studyGroupCatalog?.data) ? studyGroupCatalog.data : [];
                        const found = choices.find(option => String(option.description || '').toLowerCase() === wanted)
                            || choices.find(option => String(option.description || '').toLowerCase().includes(wanted));
                        if (!found) return { status: 'invalid_filter' };
                        nextStudyGroup = found.guid;
                    }
                }
                setVerFinalizados(nextReported);
                setListoParaLeer(nextReady);
                setAsignadosAMi(nextAssigned);
                setDateRange(nextDate);
                setDateField(nextDateField);
                setVerSinImagenes(nextNoImage);
                setVerSinOrden(nextWithoutOrder);
                setSoloConNotas(nextOnlyNotes);
                setModalityId(nextModality || undefined);
                setBodyPartId(nextBodyPart || undefined);
                setStudioTypeId(nextStudyGroup || undefined);
                setSearchTerm(nextSearch);
                setAssistantSearchOverride(nextSearch);
                setAssistantPatientId(nextPatientId);
                if (reset) {
                    setFlagFilter([]);
                }
                setActivePresetId(null);
                assistantSelectionRef.current = new Set();
                setSelectedStudyIds(new Set());
                setPage(1);
                try {
                    const params = {
                        page: 1, per_page: perPage, search: nextSearch, patient_id_exact: nextPatientId,
                        show_reported: nextReported, show_ready: nextReady, assigned_to_me: nextAssigned,
                        show_no_image: nextNoImage,
                        show_without_order: nextWithoutOrder,
                        show_only_with_notes: nextOnlyNotes, show_cancelled: reset ? false : incluirCancelado,
                        modality_id: nextModality, bodypart_id: nextBodyPart,
                        study_group_id: nextStudyGroup,
                        flag_filter: reset ? '' : flagFilter.join(','), date_range: nextDate,
                        date_field: nextDateField, sort_column: assistantSortRef.current.column,
                        sort_direction: assistantSortRef.current.direction,
                    };
                    // Share the request with the visible worklist query instead of
                    // fetching the same patient rows twice for one filter action.
                    const result = await queryClient.fetchQuery({
                        queryKey: informesKeys.list(
                            params.page, params.per_page, params.search, params.show_reported,
                            params.show_ready, params.assigned_to_me, params.show_no_image,
                            params.show_without_order, params.bodypart_id, params.modality_id,
                            params.study_group_id, params.flag_filter, params.date_range,
                            params.date_field, params.sort_column, params.sort_direction,
                            params.show_only_with_notes, params.patient_id_exact,
                        ),
                        queryFn: () => getInformes(params),
                        staleTime: ASSISTANT_FILTER_STALE_MS,
                    });
                    assistantRowsRef.current = { rows: result?.data?.data || [], total: Number(result?.data?.total || 0), page: 1 };
                    return { status: 'ok', view: 'worklist', total: Number(result?.data?.total || 0),
                        reported: nextReported, ready: nextReady, assignedToMe: nextAssigned,
                        dateRange: nextDate, modality: nextModality ? 'filtered' : 'all' };
                } catch { return { status: 'error' }; }
            }
            if (command.kind === 'editor') {
                if (isLoadingInformes || isFetchingInformes) return { status: 'loading' };
                const position = command.args.position;
                const hasPosition = position !== undefined;
                const selected = assistantSelectionRef.current;
                if (!hasPosition && selected.size > 1) {
                    toast.info('Selecciona un único estudio con su checkbox.');
                    return { status: 'needs_selection', total, selectedCount: selected.size };
                }
                const rows = assistantRowsRef.current.rows;
                if (hasPosition && (!Number.isInteger(position) || (position as number) < 1 || (position as number) > rows.length))
                    return { status: 'position_out_of_range', total, page: assistantRowsRef.current.page, visibleCount: rows.length };
                const target = hasPosition ? rows[(position as number) - 1] : selected.size === 1
                    ? rows.find((row: Informes) => selected.has(row.guid))
                    : total === 1 ? rows[0] : undefined;
                if (!target) {
                    toast.info('Selecciona un único estudio visible con su checkbox.');
                    return { status: selected.size === 1 ? 'selection_not_visible' : 'needs_selection', total, selectedCount: selected.size };
                }
                if (assistantEditorWindow.current && !assistantEditorWindow.current.closed) {
                    assistantEditorWindow.current.focus();
                    return { status: assistantEditorStudyId.current === target.guid ? 'already_open' : 'editor_already_open', view: 'editor' };
                }
                if (!canWrite) return { status: 'forbidden' };
                if (target.workflow_state === 'cancelled') return { status: 'unavailable' };
                if (target.blocked_by) return { status: 'blocked' };
                if (target.is_reported && !window.confirm('Este informe ya fue reportado. ¿Quieres abrir el redactor?')) return { status: 'cancelled' };
                if (!target.is_reported && !target.is_image && !window.confirm('Este estudio no tiene imágenes. ¿Quieres abrir el redactor?')) return { status: 'cancelled' };
                const popup = window.open('about:blank', '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1400,height=900');
                if (!popup) {
                    setPendingAssistantReport(target);
                    return { status: 'action_required', view: 'worklist' };
                }
                let locked = false;
                try {
                    await blockExam(target.guid);
                    locked = true;
                    const opened = await openReportWindow(target, null, popup);
                    if (!opened) return { status: 'popup_blocked' };
                    assistantEditorWindow.current = popup;
                    assistantEditorStudyId.current = target.guid;
                    setPendingAssistantReport(null);
                    return { status: 'ok', view: 'editor' };
                } catch { popup.close(); if (locked) void unblockExam(target.guid).catch(() => {}); return { status: 'blocked' }; }
            }
            return { status: 'unsupported' };
        });
    }, [isAdministrativeView, user?.user_type, informesData, isLoadingInformes, isFetchingInformes,
        selectedStudyIds, verFinalizados, listoParaLeer, asignadosAMi, dateRange, modalityId,
        modalidades, bodyParts, gruposEstudio,
        perPage, searchTerm, worklistSearch, assistantPatientId, verSinImagenes, verSinOrden, incluirCancelado, soloConNotas,
        bodyPartId, studioTypeId, flagFilter, dateField, sortColumn, sortDirection, page, canWrite,
        blockExam, queryClient, allColumns, visibleColumns, fixedColumnKeys, activePresetId,
        createAssistantPreset, updateAssistantPreset, getCurrentFilters]);

    const blockAndOpenReport = async (informe: Informes) => {
        const shouldOpenImages = Boolean(informe.is_image) && canViewImages;
        const viewerTicket = shouldOpenImages ? prepareViewerWindow() : null;
        if (shouldOpenImages && !viewerTicket) {
            toast.error('Por favor, permite popups para abrir el visor DICOM');
        }

        setIsBlocking(true);
        try {
            await blockExam(informe.guid);
            await openReportWindow(informe, viewerTicket);
        } catch (error) {
            if (viewerTicket) cancelPreparedViewer(viewerTicket);
            // El error ya se maneja en el hook
            console.error('Error al bloquear el informe:', error);
        } finally {
            setIsBlocking(false);
        }
    };

    const openReportWindow = async (informe: Informes, viewerTicket: ViewerWindowTicket | null, preparedWindow?: Window | null): Promise<boolean> => {
        const windowId = `report_window_${Date.now()}`;

        const params = new URLSearchParams();
        params.set('windowId', windowId);
        if (siguientePaso !== undefined && siguientePaso !== null) {
            params.set('siguiente_paso', String(siguientePaso));
        }
        params.set('show_ready', String(listoParaLeer));
        params.set('show_reported', String(verFinalizados));
        params.set('assigned_to_me', String(asignadosAMi));
        params.set('show_no_image', String(verSinImagenes));
        params.set('show_without_order', String(verSinOrden));
        params.set('sort_column', sortColumn);
        params.set('sort_direction', sortDirection);
        if (modalityId) params.set('modality_id', modalityId);
        if (bodyPartId) params.set('bodypart_id', bodyPartId);
        if (studioTypeId) params.set('study_group_id', studioTypeId);
        if (Array.isArray(informe.flags) && informe.flags.length > 0) {
            params.set('flags', informe.flags.join(','));
        }
        if (Array.isArray(informe.tag_ids) && informe.tag_ids.length > 0) {
            params.set('tag_ids', informe.tag_ids.join(','));
        }

        const studyPath = informe.study_instance_uid
            ? `/${encodeURIComponent(informe.study_instance_uid)}`
            : '';
        const url = `/worklist/redactar-informe/${encodeURIComponent(informe.guid)}${studyPath}?${params.toString()}`;

        localStorage.setItem(windowId, informe.guid);

        if (viewerTicket) {
            try {
                const data = await getDicomViewerUrl(authData!.user.id, informe.guid);
                await openStudyInViewer(viewerTicket, {
                    studyInstanceUID: data.study_uid,
                    viewerUrl: data.viewer_url,
                });
            } catch (error: unknown) {
                cancelPreparedViewer(viewerTicket);
                showViewerError(error);
            }
        }
        const reportLeft = informe.is_image ? 2500 : 100;

        // Abrir la ventana del informe
        const reportWindow = preparedWindow || window.open(
            `${url}`,
            "_blank",
            `toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no,width=1400,height=900,top=50,left=${reportLeft},titlebar=no`
        );

        // Si el navegador bloquea el popup del informe
        if (!reportWindow) {
            localStorage.removeItem(windowId);
            await unblockExam(informe.guid);
            return false;
        }
        if (preparedWindow) reportWindow.location.href = url;

        // 4️⃣ Detectar cuando se cierra - lee el GUID del localStorage (actualizado automáticamente por BroadcastChannel)
        const interval = setInterval(async () => {
            if (reportWindow.closed) {
                clearInterval(interval);

                // Leer el último GUID guardado en localStorage
                const currentGuid = localStorage.getItem(windowId);
                if (currentGuid) {
                    await unblockExam(currentGuid);
                    localStorage.removeItem(windowId);
                }
            }
        }, 300);
        return true;
    };


    const handleViewImagenes = async (informe: Informes) => {
        if (!canViewImages) {
            toast.error('No tiene permiso para visualizar imágenes');
            return;
        }
        if (!informe.is_image) {
            toast.info('El estudio no tiene imágenes disponibles');
            return;
        }
        const viewerTicket = prepareViewerWindow();
        if (!viewerTicket) {
            toast.error('Por favor, permite popups para abrir el visor DICOM');
            return;
        }

        try {
            const data = await getDicomViewerUrl(authData!.user.id, informe.guid);
            await openStudyInViewer(viewerTicket, {
                studyInstanceUID: data.study_uid,
                viewerUrl: data.viewer_url,
            });
        } catch (error: unknown) {
            cancelPreparedViewer(viewerTicket);
            showViewerError(error);
        }
    };
    const handleViewReport = async (informe: Informes) => {
        if (openingReportRef.current) return;
        openingReportRef.current = true;
        setOpeningReport(true);
        try {
            const result = await getReportView(informe.guid);
            setExternalReport(result.report);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No se pudo abrir el informe');
        } finally {
            openingReportRef.current = false;
            setOpeningReport(false);
        }
    };

    const handleShareImages = useCallback((informe: Informes) => {
        if (!informe.is_image || !informe.study_instance_uid) {
            toast.error('El estudio no tiene imágenes disponibles');
            return;
        }
        setShareModal({ kind: "images", informe });
    }, []);

    const handleShareStudy = useCallback((informe: Informes) => {
        if (!informe.study_instance_uid) {
            toast.error('El estudio no tiene imágenes disponibles');
            return;
        }
        setShareModal({ kind: "study", informe });
    }, []);

    const gruposEstudioOptions = useMemo(() => {
        if (!Array.isArray(gruposEstudio?.data)) return [];
        return gruposEstudio.data.map((estudio: any) => ({
            value: estudio.guid,
            label: estudio.description
        }));
    }, [gruposEstudio]);

    const modalidadesOptions = useMemo(() => {
        if (!Array.isArray(modalidades?.data)) return [];

        const xrayModalities = modalidades.data.filter((modalidad: any) =>
            XRAY_MODALITY_CODES.includes(String(modalidad.externalcode || '').trim().toUpperCase() as typeof XRAY_MODALITY_CODES[number])
        );
        const xrayIds = new Set(xrayModalities.map((modalidad: any) => String(modalidad.guid)));
        const xrayValue = XRAY_MODALITY_CODES
            .map((code) => xrayModalities.find((modalidad: any) => String(modalidad.externalcode || '').trim().toUpperCase() === code)?.guid)
            .filter(Boolean)
            .join(',');

        const options: { value: string; label: string }[] = [];
        let xrayOptionAdded = false;

        modalidades.data.forEach((modalidad: any) => {
            const code = String(modalidad.externalcode || '').trim().toUpperCase();
            if (xrayIds.has(String(modalidad.guid))) {
                if (!xrayOptionAdded && xrayValue) {
                    options.push({
                        value: xrayValue,
                        label: `RADIOGRAFÍA (${XRAY_MODALITY_CODES.join(' / ')})`,
                    });
                    xrayOptionAdded = true;
                }
                return;
            }

            const displayCode = DISPLAY_MODALITY_CODES[code] || code;
            options.push({
                value: modalidad.guid,
                label: `${modalidad.description} ${displayCode}`.trim(),
            });
        });

        return options;
    }, [modalidades]);

    // Presets antiguos podían guardar una sola modalidad de rayos X. Al
    // cargar el catálogo, los convertimos al nuevo filtro agrupado.
    useEffect(() => {
        if (!modalityId || !Array.isArray(modalidades?.data)) return;

        const xrayIds = new Set(
            modalidades.data
                .filter((modalidad: any) => XRAY_MODALITY_CODES.includes(String(modalidad.externalcode || '').trim().toUpperCase() as typeof XRAY_MODALITY_CODES[number]))
                .map((modalidad: any) => String(modalidad.guid))
        );
        const selectedIds = modalityId.split(',').filter(Boolean);
        if (selectedIds.length !== 1 || !xrayIds.has(selectedIds[0])) return;

        const groupedValue = XRAY_MODALITY_CODES
            .map((code) => modalidades.data.find((modalidad: any) => String(modalidad.externalcode || '').trim().toUpperCase() === code)?.guid)
            .filter(Boolean)
            .join(',');
        if (groupedValue) setModalityId(groupedValue);
    }, [modalityId, modalidades]);

    const bodyPartsOptions = useMemo(() => {
        if (!Array.isArray(bodyParts?.data)) return [];
        return bodyParts.data.map((bodyPart: any) => ({
            value: bodyPart.guid,
            label: bodyPart.description
        }));
    }, [bodyParts]);



    const activeFilterCount = [
        searchTerm.trim(), isAdministrativeView ? false : studioTypeId, modalityId, isAdministrativeView ? false : bodyPartId,
        isAdministrativeView ? incluirSinFinalizar : verFinalizados, isAdministrativeView ? false : asignadosAMi, verSinImagenes, verSinOrden, incluirCancelado, soloConNotas,
        flagFilter.length > 0, dateRange !== "all", dateField !== "admision", isAdministrativeView ? false : !listoParaLeer,
    ].filter(Boolean).length;

    const openPendingAssistantReport = async () => {
        const target = pendingAssistantReport;
        if (!target) return;
        const popup = window.open('about:blank', '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1400,height=900');
        if (!popup) { toast.error('Permite ventanas emergentes para abrir el redactor'); return; }
        let locked = false;
        try {
            await blockExam(target.guid);
            locked = true;
            const opened = await openReportWindow(target, null, popup);
            if (!opened) return;
            assistantEditorWindow.current = popup;
            assistantEditorStudyId.current = target.guid;
            setPendingAssistantReport(null);
        } catch {
            popup.close();
            if (locked) void unblockExam(target.guid).catch(() => {});
            toast.error('No se pudo abrir el redactor');
        }
    };

    return (
        <MainLayout mobileTitle={isAdministrativeView ? "Vista administrativa" : "Lista de trabajo"}>
            {pendingAssistantReport && <div className="fixed bottom-24 right-4 z-[110] rounded-lg border border-purple-400 bg-white p-3 shadow-xl dark:bg-gray-900">
                <p className="mb-2 text-sm">Chrome requiere un clic para abrir el redactor.</p>
                <button type="button" onClick={() => void openPendingAssistantReport()} className="rounded bg-purple-700 px-3 py-2 text-sm font-semibold text-white">Abrir redactor</button>
            </div>}
            <div className="page-dark-gradient min-h-0 flex-1 rounded-lg p-3 shadow-sm z-10 flex flex-col overflow-hidden">
                {/* Breadcrumb */}
                <div className="hidden md:block">
                    <DynamicBreadcrumb />
                </div>

                {/* Header */}
                <div className="hidden items-center gap-2 sm:gap-3 mb-2 md:flex">
                    <div className="bg-brand-purple p-2  rounded-lg">
                        <HandHelping className="w-4 h-4 sm:w-6 sm:h-5 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">{isAdministrativeView ? "Vista administrativa" : "Lista de trabajo"}</h1>
                </div>

                <div className="mb-2 space-y-2 md:hidden">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-brand-purple p-2 text-white"><HandHelping className="h-5 w-5" /></div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-semibold text-foreground">{isAdministrativeView ? "Vista administrativa" : "Lista de trabajo"}</h1>
                            <p className="text-xs text-muted-foreground">Solo visualización</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1"><InputSearch searchTerm={searchTerm} setSearchTerm={(value) => { setSearchTerm(value); setPage(1); }} placeholder="Buscar paciente, Patient ID o historial..." /></div>
                        <button type="button" onClick={() => setShowFilters(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground" aria-label="Abrir filtros">
                            <SlidersHorizontal className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Pestañas de presets de filtros */}
                {!isAdministrativeView && (
                    <div className="block">
                        <FilterPresetTabs
                            activePresetId={activePresetId}
                            onPresetChange={handlePresetChange}
                            currentFilters={getCurrentFilters()}
                            filtersVisible={showFilters}
                            onToggleFilters={() => setShowFilters(prev => !prev)}
                            activeFilterCount={activeFilterCount}
                        />
                    </div>
                )}

                <div className="mb-1 flex items-center justify-between px-1 text-xs md:hidden">
                    <span className="font-semibold text-foreground">Listado de reportes</span>
                    <span className="text-muted-foreground">{pagination?.total ?? 0} resultados</span>
                </div>

                {/* Bloque unificado de filtros */}
                <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-visible md:overflow-hidden">
                        {showFilters && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowFilters(false)} aria-hidden="true" />}
                        <div className={`fixed inset-y-0 left-0 z-50 w-[min(22rem,92vw)] overflow-y-auto bg-background p-3 pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl md:static md:w-auto md:overflow-visible md:bg-transparent md:p-0 md:pt-0 md:shadow-none ${showFilters ? "" : "pointer-events-none invisible"}`}>
                            <div className="mb-2 flex items-center justify-between md:hidden">
                                <span className="text-sm font-semibold text-foreground">Filtros</span>
                                <button type="button" onClick={() => setShowFilters(false)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-accent" aria-label="Cerrar filtros">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        <div className="report-filters-panel mb-2 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 sm:px-4 lg:flex-row">
                            {/* Sección de Filtros */}
                            <div className="flex flex-col gap-2 flex-1">
                                <span className="report-filters-panel__heading text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filtros</span>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
                                    <div className="min-w-0">
                                        <InputSearch
                                            searchTerm={searchTerm}
                                            setSearchTerm={(value) => { setSearchTerm(value); setPage(1); }}
                                            placeholder="Buscar paciente, Patient ID o historial..."
                                        />
                                    </div>
                                    {!isAdministrativeView && (
                                        <Autocomplete
                                            className="report-filters-panel__autocomplete"
                                            options={gruposEstudioOptions}
                                            value={studioTypeId}
                                            onValueChange={(value) => {
                                                setStudioTypeId(value);
                                                setPage(1);
                                            }}
                                            placeholder="Grupo de estudio"
                                            emptyMessage="No se encontraron grupos de estudio."
                                            searchPlaceholder="Buscar grupo de estudio..."
                                        />
                                    )}
                                    <Autocomplete
                                        className="report-filters-panel__autocomplete"
                                        options={modalidadesOptions}
                                        value={modalityId}
                                        onValueChange={(value) => {
                                            setModalityId(value);
                                            setPage(1);
                                        }}
                                        placeholder="Modalidad"
                                        emptyMessage="No se encontraron modalidades."
                                        searchPlaceholder="Buscar modalidad..."
                                    />
                                    {!isAdministrativeView && (
                                        <Autocomplete
                                            className="report-filters-panel__autocomplete"
                                            options={bodyPartsOptions}
                                            value={bodyPartId || ''}
                                            onValueChange={(value) => {
                                                setBodyPartId(value);
                                                setPage(1);
                                            }}
                                            placeholder="Parte del cuerpo"
                                            emptyMessage="No se encontraron partes del cuerpo."
                                            searchPlaceholder="Buscar parte del cuerpo..."
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Separador vertical */}
                            <div className="report-filters-panel__divider hidden w-px self-stretch bg-gray-300 lg:block" />
                            <div className="report-filters-panel__divider block h-px bg-gray-300 lg:hidden" />

                            {/* Sección de Checkboxes */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <span className="report-filters-panel__heading text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Opciones</span>
                                <div className="grid grid-cols-1 gap-x-4 gap-y-2 min-[420px]:grid-cols-2">
                                    {!isAdministrativeView && <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="listo-leer"
                                            checked={listoParaLeer}
                                            onCheckedChange={(checked) => {
                                                setListoParaLeer(checked as boolean);
                                                setPage(1);
                                            }}
                                            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple dark:data-[state=checked]:bg-purple-600 dark:data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor="listo-leer" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-200">
                                            Listo para leer
                                        </Label>
                                    </div>}
                                    {!isAdministrativeView && <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="finalizados"
                                            checked={verFinalizados}
                                            onCheckedChange={(checked) => {
                                                setVerFinalizados(checked as boolean);
                                                setPage(1);
                                            }}
                                            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple dark:data-[state=checked]:bg-purple-600 dark:data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor="finalizados" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-200">
                                            Incluir finalizados
                                        </Label>
                                    </div>}
                                    {!isAdministrativeView && <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="asignados"
                                            checked={asignadosAMi}
                                            onCheckedChange={(checked) => {
                                                setAsignadosAMi(checked as boolean);
                                                setPage(1);
                                            }}
                                            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple dark:data-[state=checked]:bg-purple-600 dark:data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor="asignados" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-200">
                                            Asignados a mí
                                        </Label>
                                    </div>}
                                    {isAdministrativeView && (
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="incluir-sin-finalizar"
                                                checked={incluirSinFinalizar}
                                                onCheckedChange={(checked) => {
                                                    setIncluirSinFinalizar(Boolean(checked));
                                                    setPage(1);
                                                }}
                                                className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple dark:data-[state=checked]:bg-purple-600 dark:data-[state=checked]:border-purple-600"
                                            />
                                            <Label htmlFor="incluir-sin-finalizar" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-200">
                                                Incluir sin finalizar
                                            </Label>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="sin-imagenes"
                                            checked={verSinImagenes}
                                            onCheckedChange={(checked) => {
                                                setVerSinImagenes(checked as boolean);
                                                setPage(1);
                                            }}
                                            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple dark:data-[state=checked]:bg-purple-600 dark:data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor="sin-imagenes" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-200">
                                            Incluir sin imágenes
                                        </Label>
                                    </div>
                                    {!isAdministrativeView && <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="sin-orden"
                                            checked={verSinOrden}
                                            onCheckedChange={(checked) => {
                                                setVerSinOrden(checked as boolean);
                                                setPage(1);
                                            }}
                                            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple dark:data-[state=checked]:bg-purple-600 dark:data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor="sin-orden" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-200">
                                            Incluir sin orden CP
                                        </Label>
                                    </div>}
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="incluir-cancelado"
                                            checked={incluirCancelado}
                                            onCheckedChange={(checked) => {
                                                setIncluirCancelado(checked === true);
                                                setPage(1);
                                            }}
                                            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple"
                                        />
                                        <Label htmlFor="incluir-cancelado" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-200">
                                            Incluir Cancelado
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="solo-con-notas"
                                            checked={soloConNotas}
                                            onCheckedChange={(checked) => {
                                                setSoloConNotas(checked as boolean);
                                                setPage(1);
                                            }}
                                            className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple dark:data-[state=checked]:bg-purple-600 dark:data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor="solo-con-notas" className="text-sm font-medium text-gray-700 cursor-pointer dark:text-gray-200">
                                            Solo con notas
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Separador vertical */}
                            <div className="report-filters-panel__divider hidden w-px self-stretch bg-gray-300 lg:block" />
                            <div className="report-filters-panel__divider block h-px bg-gray-300 lg:hidden" />

                            {/* Sección de Banderas */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <span className="report-filters-panel__heading text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Banderas</span>
                                <div className="flex items-center gap-1.5">
                                    {(["red", "green", "blue", "yellow"] as const).map((color) => {
                                        const active = flagFilter.includes(color);
                                        const svgFill: Record<string, string> = {
                                            red: "#ef4444", green: "#22c55e", blue: "#3b82f6", yellow: "#facc15"
                                        };
                                        const svgStroke: Record<string, string> = {
                                            red: "#b91c1c", green: "#15803d", blue: "#1d4ed8", yellow: "#a16207"
                                        };
                                        const label: Record<string, string> = {
                                            red: "Roja", green: "Verde", blue: "Azul", yellow: "Amarilla"
                                        };
                                        return (
                                            <button
                                                key={color}
                                                title={`Filtrar: ${label[color]}`}
                                                onClick={() => {
                                                    setFlagFilter(prev =>
                                                        prev.includes(color)
                                                            ? prev.filter(f => f !== color)
                                                            : [...prev, color]
                                                    );
                                                    setPage(1);
                                                }}
                                                className={`report-filters-panel__flag flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-all focus:outline-none
                                            ${active ? "report-filters-panel__flag--active bg-gray-200 ring-1 ring-gray-400 scale-110" : "opacity-50 hover:opacity-80"}`}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24"
                                                    fill={svgFill[color]} stroke={svgStroke[color]}
                                                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="4" y1="2" x2="4" y2="22" />
                                                    <polyline points="4,2 20,9 4,16" />
                                                </svg>
                                                <span className="report-filters-panel__flag-label text-[9px] text-gray-500 leading-none">{label[color]}</span>
                                            </button>
                                        );
                                    })}
                                    {flagFilter.length > 0 && (
                                        <button
                                            onClick={() => { setFlagFilter([]); setPage(1); }}
                                            className="report-filters-panel__clear-flags text-xs text-gray-400 hover:text-gray-600 ml-1 self-start mt-1"
                                            title="Limpiar filtro de banderas"
                                        >✕</button>
                                    )}
                                </div>
                            </div>

                            {/* Separador vertical */}
                            <div className="report-filters-panel__divider hidden w-px self-stretch bg-gray-300 lg:block" />
                            <div className="report-filters-panel__divider block h-px bg-gray-300 lg:hidden" />

                            {/* Sección de Fechas */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <span className="report-filters-panel__heading text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Fechas</span>
                                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                                    <Select
                                        value={dateField}
                                        onValueChange={(value) => {
                                            setDateField(value);
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-sm min-w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admision">Admisión</SelectItem>
                                            <SelectItem value="reporte">Reporte</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={dateRange}
                                        onValueChange={(value) => {
                                            setDateRange(value);
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-sm min-w-[130px]">
                                            <SelectValue placeholder="Hasta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todo</SelectItem>
                                            <SelectItem value="1d">Último día</SelectItem>
                                            <SelectItem value="3d">Últimos 3 días</SelectItem>
                                            <SelectItem value="7d">Últimos 7 días</SelectItem>
                                            <SelectItem value="14d">Últimos 14 días</SelectItem>
                                            <SelectItem value="1m">Último mes</SelectItem>
                                            <SelectItem value="2m">Últimos 2 meses</SelectItem>
                                            <SelectItem value="3m">Últimos 3 meses</SelectItem>
                                            <SelectItem value="1y">Último año</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>

                <TablaDynamic<Informes>
                    data={(informesData?.data?.data) || []}
                    columns={filteredColumns}
                    loading={isLoadingInformes}
                    refreshing={isFetchingInformes && !isLoadingInformes}
                    refreshError={Boolean(informesError)}
                    refreshScopeKey={JSON.stringify([isAdministrativeView, page, perPage, debouncedColumnFilters, worklistSearch, assistantPatientId, verFinalizados, listoParaLeer, asignadosAMi, verSinImagenes, verSinOrden, incluirCancelado, soloConNotas, bodyPartId, modalityId, studioTypeId, flagFilter, dateRange, dateField, sortColumn, sortDirection])}
                    filterAnimationKey={JSON.stringify([isAdministrativeView, debouncedColumnFilters, worklistSearch, assistantPatientId, verFinalizados, listoParaLeer, asignadosAMi, verSinImagenes, verSinOrden, incluirCancelado, soloConNotas, bodyPartId, modalityId, studioTypeId, flagFilter, dateRange, dateField])}
                    additionalChangeValue={(row) => [row.notes_count, row.general_notes, row.report_available, row.blocked_by]}
                    serverSideFiltering
                    onColumnFiltersChange={(filters) => {
                        setColumnFilters(filters);
                        setPage(1);
                    }}
                    pagination={pagination}
                    actions={isAdministrativeView
                        ? getAdministrativeInformesActions(
                            handleViewImagenes,
                            handleViewReport,
                            handleShareImages,
                            handleShareStudy,
                            getGeneralNotesAction(handleUpdateGeneralNotes, handleDeleteNote, canDeleteNotes, isUpdatingNotes, isDeletingNote),
                            canViewImages,
                            canShareImages,
                        )
                        : getInformesActions(handleRedactarInforme, handleViewImagenes, handleViewReport, getGeneralNotesAction(handleUpdateGeneralNotes, handleDeleteNote, canDeleteNotes, isUpdatingNotes, isDeletingNote), canWrite, canAssign ? handleAssignExam : undefined, canConfirmExecute ? handleOpenConfirmStudy : undefined, isAdmin ? handleAdminUnlock : undefined, isAdmin, canViewImages)}
                    onPaginationChange={(newPage) => {
                        setPage(newPage);
                    }}
                    perPageValue={perPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        setPage(1);
                    }}
                    perPageOptions={[10, 20, 50, 100]}
                    allColumns={allColumns}
                    visibleColumns={visibleColumns}
                    onToggleColumn={toggleColumn}
                    fixedColumnKeys={fixedColumnKeys}
                    onColumnOrderChange={handleColumnOrderChange}
                    tableBackgroundImage={fondoImage}
                    tableBackgroundImageDark={backDarkImage}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    selectedRowIds={selectedStudyIds}
                    onRowClick={(row, _index, event) => {
                        if (event.ctrlKey || event.metaKey) {
                            toggleStudySelection(row.guid);
                        } else {
                            setSelectedStudyIds(new Set([row.guid]));
                        }
                    }}
                    onRowContextMenu={handleRowContextMenu}
                    onRowDoubleClick={(row) => {
                        if (!isAdministrativeView && canWrite) {
                            void handleRedactarInforme(row);
                        } else {
                            void handleViewImagenes(row);
                        }
                    }}
                    mobileMode="cards"
                    mobileActions="menu"
                    mobileStatusKey="status"
                    additionalControls={
                        <div className="flex items-center gap-4">
                            {!isAdministrativeView && selectedStudyIds.size > 0 && (
                                <>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                        <span>{selectedStudyIds.size} seleccionado{selectedStudyIds.size !== 1 ? 's' : ''}</span>
                                        <button
                                            onClick={clearSelection}
                                            className="ml-1 hover:text-purple-900"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                Accion multiple
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {canAssign && (
                                                <DropdownMenuItem onClick={() => setMultiSelectAction('assign')}>
                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                    Asignar a...
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => setMultiSelectAction('tags')}>
                                                <Tags className="h-4 w-4 mr-2" />
                                                Agregar tag
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setMultiSelectAction('flags')}>
                                                <Flag className="h-4 w-4 mr-2" />
                                                Agregar banderas
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                            {!isAdministrativeView && <div className="flex items-center gap-2">
                                <Label htmlFor="siguiente-paso-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Siguiente estudio:
                                </Label>
                                <Switch
                                    id="siguiente-paso-toggle"
                                    checked={siguientePaso}
                                    onCheckedChange={setSiguientePaso}
                                />
                            </div>}
                            <button
                                onClick={() => {
                                    refetchInformes();
                                    toast.success('Lista actualizada exitosamente');
                                }}
                                className="p-1.5 rounded-md bg-brand-purple text-white hover:bg-brand-purple/90 transition-colors cursor-pointer dark:bg-purple-600 dark:hover:bg-purple-700"
                            >
                                <RefreshCcw className="h-4 w-4" />
                            </button>
                        </div>
                    }
                />

                {contextMenu && !isAdministrativeView && (
                    <DropdownMenu open modal={false} onOpenChange={(open) => { if (!open) setContextMenu(null); }}>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                aria-label="Acciones del estudio"
                                className="pointer-events-none fixed h-px w-px opacity-0"
                                style={{ left: contextMenu.x, top: contextMenu.y }}
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            sideOffset={0}
                            collisionPadding={8}
                            onCloseAutoFocus={(event) => event.preventDefault()}
                            onContextMenu={(event) => event.preventDefault()}
                            className="z-[80] w-56 rounded-lg border-purple-200 bg-white dark:border-purple-800 dark:bg-[#1b1230]"
                        >
                            <DropdownMenuLabel className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-purple-900 dark:text-gray-400">
                                Acciones del estudio
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                disabled={!canAssign}
                                onSelect={() => handleContextAction('assign')}
                                className="gap-2 px-3 py-2 text-gray-700 focus:bg-purple-50 dark:text-gray-200 dark:focus:bg-purple-900/40"
                            >
                                <UserCheck className="h-4 w-4 text-brand-purple" />
                                Asignar a...
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => handleContextAction('tags')}
                                className="gap-2 px-3 py-2 text-gray-700 focus:bg-purple-50 dark:text-gray-200 dark:focus:bg-purple-900/40"
                            >
                                <Tags className="h-4 w-4 text-brand-purple" />
                                Agregar tag
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => handleContextAction('flags')}
                                className="gap-2 px-3 py-2 text-gray-700 focus:bg-purple-50 dark:text-gray-200 dark:focus:bg-purple-900/40"
                            >
                                <Flag className="h-4 w-4 text-brand-purple" />
                                Agregar banderas
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={!canWrite}
                                onSelect={() => handleContextAction('template')}
                                className="gap-2 px-3 py-2 text-gray-700 focus:bg-purple-50 dark:text-gray-200 dark:focus:bg-purple-900/40"
                            >
                                <FileText className="h-4 w-4 text-brand-purple" />
                                Cambiar Plantilla
                            </DropdownMenuItem>
                            {canShareWorklist && (
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="gap-2 px-3 py-2 text-gray-700 focus:bg-purple-50 data-[state=open]:bg-purple-50 dark:text-gray-200 dark:focus:bg-purple-900/40 dark:data-[state=open]:bg-purple-900/40">
                                        <Share2 className="h-4 w-4 text-brand-purple" />
                                        Compartir
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent collisionPadding={8} className="z-[81] min-w-48 border-purple-200 bg-white dark:border-purple-800 dark:bg-[#1b1230]">
                                            <DropdownMenuItem
                                                disabled={!contextMenu.row.is_image || !contextMenu.row.study_instance_uid}
                                                onSelect={() => {
                                                    handleShareImages(contextMenu.row);
                                                    setContextMenu(null);
                                                }}
                                                className="gap-2 px-3 py-2 text-gray-700 focus:bg-purple-50 dark:text-gray-200 dark:focus:bg-purple-900/40"
                                            >
                                                <Image className="h-4 w-4 text-brand-purple" />
                                                Imágenes
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                disabled={!contextMenu.row.study_instance_uid}
                                                onSelect={() => {
                                                    handleShareStudy(contextMenu.row);
                                                    setContextMenu(null);
                                                }}
                                                className="gap-2 px-3 py-2 text-gray-700 focus:bg-purple-50 dark:text-gray-200 dark:focus:bg-purple-900/40"
                                            >
                                                <FileText className="h-4 w-4 text-brand-purple" />
                                                Estudio
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}


                <TemplateModal
                    isOpen={isContextTemplateModalOpen}
                    onClose={() => {
                        setIsContextTemplateModalOpen(false);
                        setContextTemplateRow(null);
                        setContextTemplateSearchTerm('');
                        setContextOnlyStudyType(false);
                        setSelectedContextTemplate(null);
                    }}
                    searchTerm={contextTemplateSearchTerm}
                    setSearchTerm={(term) => {
                        setContextTemplateSearchTerm(term);
                        setSelectedContextTemplate(null);
                    }}
                    hasStudyType={Boolean(contextStudyTypeId)}
                    onlyStudyType={contextOnlyStudyType && Boolean(contextStudyTypeId)}
                    setOnlyStudyType={(value) => {
                        setContextOnlyStudyType(value);
                        setSelectedContextTemplate(null);
                    }}
                    isLoading={isLoadingContextTemplates}
                    hasError={contextTemplatesError}
                    filteredTemplates={filteredContextTemplates}
                    selectedTemplate={selectedContextTemplate}
                    setSelectedTemplate={setSelectedContextTemplate}
                    onAccept={() => {
                        if (!contextTemplateRow || !selectedContextTemplate) {
                            toast.error('Por favor seleccione una plantilla');
                            return;
                        }

                        setPendingTemplateChange({ row: contextTemplateRow, template: selectedContextTemplate });
                        setIsContextTemplateModalOpen(false);
                        setContextTemplateRow(null);
                    }}
                />

            </div>

            {/* Modal de Confirmación */}
            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={() => {
                    setIsConfirmationModalOpen(false);
                    setSelectedInforme(null);
                }}
                onConfirm={async () => {
                    if (selectedInforme) {
                        setIsConfirmationModalOpen(false);
                        await blockAndOpenReport(selectedInforme);
                        setSelectedInforme(null);
                    }
                }}
                title="Informe ya finalizado"
                message="Este informe ya ha sido finalizado y reportado. Al continuar, se bloqueará el informe para que nadie más pueda editarlo mientras usted trabaja en él. ¿Está seguro que desea continuar?"
                confirmText="Sí, abrir y bloquear informe"
                cancelText="Cancelar"
                variant="warning"
            />
            {/* Modal de sin imágenes */}
            <ConfirmationModal
                isOpen={isNoImageModalOpen}
                onClose={() => {
                    setIsNoImageModalOpen(false);
                    setSelectedInforme(null);
                }}
                onConfirm={async () => {
                    if (selectedInforme) {
                        setIsNoImageModalOpen(false);
                        await blockAndOpenReport(selectedInforme);
                        setSelectedInforme(null);
                    }
                }}
                title="Informe sin imágenes"
                message="Este informe no tiene imágenes asociadas. ¿Desea continuar de todas formas?"
                confirmText="Sí, continuar"
                cancelText="Cancelar"
                variant="warning"
            />
            <ConfirmationModal
                isOpen={Boolean(pendingTemplateChange)}
                onClose={() => setPendingTemplateChange(null)}
                onConfirm={() => void handleApplyContextTemplate()}
                title="Cambiar plantilla"
                message="Se reemplazará el contenido actual del informe por el de la plantilla seleccionada. ¿Desea continuar?"
                confirmText="Sí, cambiar plantilla"
                cancelText="Cancelar"
                variant="warning"
                isLoading={isChangingTemplate}
            />

            {/* Modal de Asignar Estudio */}
            <AssignExamModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setSelectedExamForAssign(null);
                }}
                examId={selectedExamForAssign?.guid || ""}
                currentAssigneeName={selectedExamForAssign?.assignto_name}
                onAssign={handleConfirmAssign}
            />

            <ConfirmStudyModal
                isOpen={isConfirmStudyModalOpen}
                onClose={closeConfirmStudyModal}
                patientName={selectedExamForConfirm?.patient_name}
                isEditing={Boolean(selectedExamForConfirm?.w_order === 1 || selectedExamForConfirm?.is_executed)}
                initialData={{
                    referring_physician_id: selectedExamForConfirm?.referring_physician_id || null,
                    requesting_physician_id: selectedExamForConfirm?.requesting_physician_id || null,
                    requesting_physician_name: selectedExamForConfirm?.requesting_physician_name || "",
                    studytype_id: selectedExamForConfirm?.study_type_id || "",
                    clinical_question: selectedExamForConfirm?.clinical_question || "",
                    modality_id: selectedExamForConfirm?.modality_id || null,
                    modality_description: selectedExamForConfirm?.modality_description || "",
                    other_details: selectedExamForConfirm?.other_details || "",
                    laterality_id: selectedExamForConfirm?.laterality_id || null,
                }}
                onConfirm={handleConfirmStudy}
                onCancelStudy={canConfirmExecute && selectedExamForConfirm?.workflow_state === 'pending' && !selectedExamForConfirm?.is_reported
                    ? handleOpenCancelStudy
                    : undefined}
            />

            <CancelStudyModal
                key={selectedExamForConfirm?.guid || 'cancel-study-modal'}
                isOpen={isCancelStudyModalOpen}
                onClose={() => {
                    setIsCancelStudyModalOpen(false);
                    setSelectedExamForConfirm(null);
                }}
                reasons={cancellationReasonsResponse?.data || []}
                isLoading={isCancellingStudy}
                onConfirm={handleCancelStudy}
            />


            <LocalReportDialog report={externalReport} onClose={() => setExternalReport(null)} />
            {openingReport && (
                <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg">
                    <Loader2 className="size-4 animate-spin text-purple-600" />
                    Consultando informe…
                </div>
            )}

            {/* Modal de Acciones Múltiples */}
            <MultiSelectActionsModal
                isOpen={multiSelectAction !== null}
                onClose={() => setMultiSelectAction(null)}
                action={multiSelectAction}
                selectedCount={selectedStudyIds.size}
                onAssign={handleMultiSelectAssign}
                onAddTags={handleMultiSelectAddTags}
                onAddFlags={handleMultiSelectAddFlags}
                availableTags={allTags || []}
            />

            {shareModal && (
                <AdministrativeShareModal
                    kind={shareModal.kind}
                    examId={shareModal.informe.guid}
                    studyIuid={shareModal.informe.study_instance_uid}
                    patientName={shareModal.informe.patient_name}
                    studyDescription={shareModal.informe.study_type}
                    onClose={() => setShareModal(null)}
                />
            )}

            {missingImageStudy && (
                <MissingImageLinkModal
                    study={missingImageStudy}
                    onClose={() => setMissingImageStudy(null)}
                    onLinked={() => {
                        setMissingImageStudy(null);
                        void refetchInformes();
                    }}
                />
            )}

            {/* Modal de carga mientras bloquea */}
            {isBlocking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
                        <p className="text-gray-700 font-medium">Bloqueando informe...</p>
                    </div>
                </div>
            )}
        </MainLayout>
    )
}
