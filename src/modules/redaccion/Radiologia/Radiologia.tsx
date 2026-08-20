import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import { MainLayout } from "@/layouts/layout"
import { HandHelping, RefreshCcw, Loader2, AlertTriangle, SlidersHorizontal, X, UserCheck, Tags, Flag } from "lucide-react"
import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useInformes, useBlockExam, useUnblockExam, useUpdateFlags, useUpdateTagIds, useAllTags, useUpdateGeneralNotes, useDeleteExaminationNote, useAssignExam, useAssignExamBatch, useAddTagsBatch, useAddFlagsBatch, useConfirmStudy } from "./hooks/use-informes"
import { useCrossWindowSync } from "./redactar-informe/hooks/use-cross-windows"
import { getInformesActions, getFlagsColumn, getTagsColumn, getGeneralNotesAction, getPatientNameColumn, getSelectionColumn, informeColumns } from "./components/columns"
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
import { FilterPresetTabs } from "./components/FilterPresetTabs"
import { Autocomplete } from "@/components/autocomplete"
import { useBodyParts } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo"
import { useModalidades } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades"
import { useGrupoEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/grupos-estudio"
import { useFilterPresets } from "./hooks/use-filter-presets"
import { useAuth } from "@/context/AuthContext"
import { useAppConfig } from "@/context/AppConfigContext"
import { getDicomViewerUrl } from "@/services/dicomViewer"
import { cancelPreparedViewer, openStudyInViewer, prepareViewerWindow } from "@/services/viewerWindow"
import type { ViewerWindowTicket } from "@/services/viewerWindow"
import type { ConfirmStudyPayload } from "./services/informes.service"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import fondoImage from "@/assets/redaccion.jpg"
import backDarkImage from "@/assets/back-dark.jpg";

const FIXED_COLUMN_KEYS = ["_selection", "is_reported"] as const;
const XRAY_MODALITY_CODES = ["DX", "CR", "RX"] as const;
const DISPLAY_MODALITY_CODES: Record<string, string> = { RMN: "MR" };

const normalizeVisibleColumns = (columnKeys: string[]) => [
    ...FIXED_COLUMN_KEYS,
    ...columnKeys.filter((key) => !FIXED_COLUMN_KEYS.includes(key as typeof FIXED_COLUMN_KEYS[number])),
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

export const Radiologia = () => {
    const isMobile = useIsMobile();
    // Hook para sincronizar entre ventanas
    useCrossWindowSync();

    const { authData, refreshPermissions } = useAuth();
    const { config } = useAppConfig();

    useEffect(() => {
        refreshPermissions();
    }, []);
    const user = authData?.user;
    const isAdmin = Boolean(
        user?.permissions?.includes("*")
        || user?.role_name?.toLowerCase() === "sysadmin"
        || user?.user_type?.toLowerCase() === "sysadmin"
        || user?.username?.toLowerCase() === "sysadmin"
    );

    const { data: facilityPlanData } = useQuery({
        queryKey: ["facility-plan", config?.id?.toString() || "1", "radiologia"],
        queryFn: async () => {
            const response = await api.get(`/config/facilities/${config?.id?.toString() || "1"}/plan`);
            return response.data?.data || null;
        },
        enabled: Boolean(authData && config?.id?.toString() || "1"),
        staleTime: 60 * 1000,
    });

    const readMonthlyLimit: number | null = facilityPlanData?.plan?.max_read_monthly ?? null;
    const readCount: number = facilityPlanData?.usage_monthly?.read_count ?? 0;
    const isReadLimitReached =
        typeof readMonthlyLimit === "number"
        && readMonthlyLimit >= 0
        && readCount >= readMonthlyLimit;

    const [studioTypeId, setStudioTypeId] = useState<string | undefined>(undefined);
    const [bodyPartId, setBodyPartId] = useState<string | undefined>(undefined);
    const [modalityId, setModalityId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [verFinalizados, setVerFinalizados] = useState(false);
    const [asignadosAMi, setAsignadosAMi] = useState(false);
    const [listoParaLeer, setListoParaLeer] = useState(true);
    const [verSinImagenes, setVerSinImagenes] = useState(false);
    // Los estudios recibidos desde PACS pueden no tener todavía una orden CP.
    // Se muestran por defecto y el usuario puede ocultarlos desde el filtro.
    const [verSinOrden, setVerSinOrden] = useState(true);
    const [soloConNotas, setSoloConNotas] = useState(false);
    const [flagFilter, setFlagFilter] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<string>("all");
    const [dateField, setDateField] = useState<string>("admision");
    const [showFilters, setShowFilters] = useState(() => typeof window === "undefined" || window.innerWidth >= 768);
    const [siguientePaso, setSiguientePaso] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isNoImageModalOpen, setIsNoImageModalOpen] = useState(false);
    const [isConfirmStudyModalOpen, setIsConfirmStudyModalOpen] = useState(false);
    const [selectedExamForConfirm, setSelectedExamForConfirm] = useState<Informes | null>(null);
    const [selectedInforme, setSelectedInforme] = useState<Informes | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        normalizeVisibleColumns(["patient_name", "patient_dni", "assignto_name", "study_type", "accession_number", "created_on", "num_instances", "flags", "tag_ids"])
    );
    const [sortColumn, setSortColumn] = useState("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const presetsInitializedRef = useRef(false);

    const useDebounceSearch = useDebounce(searchTerm, 500);
    const { mutateAsync: blockExam } = useBlockExam();
    const { mutateAsync: unblockExam } = useUnblockExam();
    const { mutate: updateFlags, isPending: isUpdatingFlags } = useUpdateFlags();
    const { mutate: updateTagIds, isPending: isUpdatingTagIds } = useUpdateTagIds();
    const { allTags } = useAllTags();
    const { mutate: updateGeneralNotes, isPending: isUpdatingNotes } = useUpdateGeneralNotes();
    const { mutate: deleteExaminationNote, isPending: isDeletingNote } = useDeleteExaminationNote();
    const { informesData, isLoading: isLoadingInformes, refetchInformes } = useInformes({ page, per_page: perPage, search: useDebounceSearch, show_reported: verFinalizados, show_ready: listoParaLeer, assigned_to_me: asignadosAMi, show_no_image: verSinImagenes, show_without_order: verSinOrden, show_only_with_notes: soloConNotas, bodypart_id: bodyPartId, modality_id: modalityId, study_group_id: studioTypeId, flag_filter: flagFilter.join(','), date_range: dateRange, date_field: dateField, sort_column: sortColumn, sort_direction: sortDirection, facility_id: config?.id?.toString() || "1" });
    const { gruposEstudio } = useGrupoEstudio();
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();
    const { presets, isLoading: isLoadingPresets } = useFilterPresets();

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedExamForAssign, setSelectedExamForAssign] = useState<Informes | null>(null);
    const { mutateAsync: assignExam } = useAssignExam();
    const { mutateAsync: confirmStudy } = useConfirmStudy();
    const { mutateAsync: assignExamBatch } = useAssignExamBatch();
    const { mutateAsync: addTagsBatch } = useAddTagsBatch();
    const { mutateAsync: addFlagsBatch } = useAddFlagsBatch();

    const canAssign = authData?.user?.permissions?.includes('reports.assign') ?? false;
    const canDeleteNotes = authData?.user?.permissions?.includes('*')
        || authData?.user?.permissions?.includes('reports.notes.delete')
        || false;

    const [selectedStudyIds, setSelectedStudyIds] = useState<Set<string>>(new Set());
    const [multiSelectAction, setMultiSelectAction] = useState<'assign' | 'tags' | 'flags' | null>(null);

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

    // Función para toggle de columnas
    const toggleColumn = useCallback((columnKey: string) => {
        if (FIXED_COLUMN_KEYS.includes(columnKey as typeof FIXED_COLUMN_KEYS[number])) return;

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
    }, []);

    const handleColumnOrderChange = useCallback((columnKeys: string[]) => {
        setVisibleColumns(normalizeVisibleColumns(columnKeys));
    }, []);

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

    // Columna de paciente con tooltip de bloqueo y opción de desbloqueo para admin
    const patientNameColumn = useMemo(
        () => getPatientNameColumn(isAdmin ? handleAdminUnlock : null, isAdmin),
        [handleAdminUnlock, isAdmin]
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

    // Todas las columnas disponibles (selección + paciente + estáticas + banderas + tags)
    const allColumns = useMemo(() => [selectionColumn, patientNameColumn, ...informeColumns, flagsColumn, tagsColumn], [selectionColumn, patientNameColumn, flagsColumn, tagsColumn]);

    // Columnas visibles (incluye banderas si está en la lista)
    const filteredColumns = useMemo(
        () => allColumns.filter(col => visibleColumns.includes(col.key as string)),
        [allColumns, visibleColumns]
    );

    // Función para obtener los filtros actuales como objeto
    const getCurrentFilters = useCallback((): FilterPresetFilters => ({
        search: searchTerm,
        listo_para_leer: listoParaLeer,
        ver_finalizados: verFinalizados,
        asignados_a_mi: asignadosAMi,
        ver_sin_imagenes: verSinImagenes,
        ver_sin_orden: verSinOrden,
        study_group_id: studioTypeId || "",
        modality_id: modalityId || "",
        bodypart_id: bodyPartId || "",
        visible_columns: visibleColumns,
        per_page: perPage,
        sort_column: sortColumn,
        sort_direction: sortDirection,
        date_range: dateRange,
        date_field: dateField,
        flag_filter: flagFilter.join(','),
        filters_visible: showFilters,
    }), [searchTerm, listoParaLeer, verFinalizados, asignadosAMi, verSinImagenes, studioTypeId, modalityId, bodyPartId, visibleColumns, perPage, sortColumn, sortDirection, dateRange, dateField, flagFilter, showFilters]);

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
            setStudioTypeId(undefined);
            setModalityId(undefined);
            setBodyPartId(undefined);
            setVisibleColumns(normalizeVisibleColumns([...informeColumns.map(col => col.key as string), "flags", "tag_ids", "report_date"]));
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
            setStudioTypeId(f.study_group_id || undefined);
            setModalityId(f.modality_id || undefined);
            setBodyPartId(f.bodypart_id || undefined);
            const cols = f.visible_columns?.length ? f.visible_columns : [...informeColumns.map(col => col.key as string), "flags"];
            const colsWithReportDate = cols.includes("report_date") ? cols : [...cols, "report_date"];
            const colsWithInstances = colsWithReportDate.includes("num_instances") ? colsWithReportDate : [...colsWithReportDate, "num_instances"];
            setVisibleColumns(normalizeVisibleColumns(colsWithInstances.includes("assignto_name") ? colsWithInstances : [...colsWithInstances, "assignto_name"]));
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
        if (!isLoadingPresets && !presetsInitializedRef.current) {
            presetsInitializedRef.current = true;
            const activePreset = presets.find(p => p.is_active);
            if (activePreset) {
                applyPreset(activePreset);
            }
        }
    }, [isLoadingPresets, presets, applyPreset]);

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
        if (isReadLimitReached) {
            toast.error(`Límite mensual de redacción alcanzado (${readCount}/${readMonthlyLimit}).`);
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

    const blockAndOpenReport = async (informe: Informes) => {
        const viewerTicket = informe.is_image ? prepareViewerWindow() : null;
        if (informe.is_image && !viewerTicket) {
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

    const openReportWindow = async (informe: Informes, viewerTicket: ViewerWindowTicket | null) => {
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
        const url = `/estudios/redaccion/redactar-informe/${encodeURIComponent(informe.guid)}${studyPath}?${params.toString()}`;

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
        const reportWindow = window.open(
            `${url}`,
            "_blank",
            `toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no,width=1400,height=900,top=50,left=${reportLeft},titlebar=no`
        );

        // Si el navegador bloquea el popup del informe
        if (!reportWindow) {
            localStorage.removeItem(windowId);
            await unblockExam(informe.guid);
            return;
        }

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
    };


    const handleViewImagenes = async (informe: Informes) => {
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
    const handleViewPdf = (informe: Informes) => {
        if (!informe.pdf_path) {
            toast.error('Este informe todavía no tiene un PDF generado');
            return;
        }
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        window.open(
            `${baseURL}/pdfs/by-exam/${encodeURIComponent(informe.guid)}`,
            '_blank',
        );
    };

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
        searchTerm.trim(), studioTypeId, modalityId, bodyPartId,
        verFinalizados, asignadosAMi, verSinImagenes, verSinOrden, soloConNotas,
        flagFilter.length > 0, dateRange !== "all", dateField !== "admision", !listoParaLeer,
    ].filter(Boolean).length;

    return (
        <MainLayout mobileTitle="Redacción de reportes">
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
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">Redacción de reportes</h1>
                </div>

                {isReadLimitReached && (
                    <div className="mb-3 rounded-lg border border-red-500/70 bg-red-500/15 px-4 py-3 text-sm text-red-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                            <strong className="font-semibold">Límite alcanzado:</strong> ya no tienes disponibilidad para redactar más estudios este mes ({readCount}/{readMonthlyLimit}).
                        </div>
                    </div>
                )}

                <div className="mb-2 space-y-2 md:hidden">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-brand-purple p-2 text-white"><HandHelping className="h-5 w-5" /></div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-semibold text-foreground">Reportes</h1>
                            <p className="text-xs text-muted-foreground">Solo visualización</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1"><InputSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar paciente o historial..." /></div>
                        <button type="button" onClick={() => setShowFilters(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground" aria-label="Abrir filtros">
                            <SlidersHorizontal className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Pestañas de presets de filtros */}
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
                                            setSearchTerm={setSearchTerm}
                                            placeholder="Buscar paciente o historial..."
                                        />
                                    </div>
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
                                </div>
                            </div>

                            {/* Separador vertical */}
                            <div className="report-filters-panel__divider hidden w-px self-stretch bg-gray-300 lg:block" />
                            <div className="report-filters-panel__divider block h-px bg-gray-300 lg:hidden" />

                            {/* Sección de Checkboxes */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <span className="report-filters-panel__heading text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Opciones</span>
                                <div className="grid grid-cols-1 gap-x-4 gap-y-2 min-[420px]:grid-cols-2">
                                    <div className="flex items-center space-x-2">
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
                                    </div>
                                    <div className="flex items-center space-x-2">
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
                                    </div>
                                    <div className="flex items-center space-x-2">
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
                                    </div>
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
                                    <div className="flex items-center space-x-2">
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
                    pagination={pagination}
                    actions={getInformesActions(handleRedactarInforme, handleViewImagenes, handleViewPdf, getGeneralNotesAction(handleUpdateGeneralNotes, handleDeleteNote, canDeleteNotes, isUpdatingNotes, isDeletingNote), isReadLimitReached, canAssign ? handleAssignExam : undefined, handleOpenConfirmStudy)}
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
                    fixedColumnKeys={[...FIXED_COLUMN_KEYS]}
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
                    onRowDoubleClick={(row) => handleRedactarInforme(row)}
                    mobileMode="cards"
                    mobileActions="menu"
                    mobileStatusKey="status"
                    additionalControls={
                        <div className="flex items-center gap-4">
                            {selectedStudyIds.size > 0 && (
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
                            <div className="flex items-center gap-2">
                                <Label htmlFor="siguiente-paso-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Siguiente estudio:
                                </Label>
                                <Switch
                                    id="siguiente-paso-toggle"
                                    checked={siguientePaso}
                                    onCheckedChange={setSiguientePaso}
                                />
                            </div>
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
                initialData={{
                    referring_physician_id: selectedExamForConfirm?.referring_physician_id || null,
                    requesting_physician_id: selectedExamForConfirm?.requesting_physician_id || null,
                    requesting_physician_name: selectedExamForConfirm?.requesting_physician_name || "",
                    studytype_id: selectedExamForConfirm?.study_type_id || "",
                    clinical_question: selectedExamForConfirm?.clinical_question || "",
                    modality_id: selectedExamForConfirm?.modality_id || null,
                    modality_description: selectedExamForConfirm?.modality_description || "",
                    other_details: selectedExamForConfirm?.other_details || "",
                }}
                onConfirm={handleConfirmStudy}
            />

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
