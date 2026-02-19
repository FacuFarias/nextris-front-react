import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import { MainLayout } from "@/layouts/layout"
import { HandHelping, RefreshCcw, Loader2 } from "lucide-react"
import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useInformes, useBlockExam, useUnblockExam, useUpdateFlags, useUpdateTagIds, useAllTags } from "./hooks/use-informes"
import { useCrossWindowSync } from "./redactar-informe/hooks/use-cross-windows"
import { getInformesActions, getFlagsColumn, getTagsColumn, informeColumns } from "./components/columns"
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
import { FilterPresetTabs } from "./components/FilterPresetTabs"
import { Autocomplete } from "@/components/autocomplete"
import { useBodyParts } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo"
import { useModalidades } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades"
import { useGrupoEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/grupos-estudio"
import { useFilterPresets } from "./hooks/use-filter-presets"
import fondoImage from "@/assets/redaccion.jpg"

export const Radiologia = () => {
    // Hook para sincronizar entre ventanas
    useCrossWindowSync();

    // Ref para guardar las ventanas del visor de imágenes (windowId -> Window)
    const viewerWindowsRef = useRef<Map<string, Window>>(new Map());

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
    const [flagFilter, setFlagFilter] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<string>("all");
    const [dateField, setDateField] = useState<string>("admision");
    const [showFilters, setShowFilters] = useState(true);
    const [siguientePaso, setSiguientePaso] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isNoImageModalOpen, setIsNoImageModalOpen] = useState(false);
    const [selectedInforme, setSelectedInforme] = useState<Informes | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        [...informeColumns.map(col => col.key as string), "flags", "tag_ids", "report_date"]
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
    const { informesData, isLoading: isLoadingInformes, refetchInformes } = useInformes({ page, per_page: perPage, search: useDebounceSearch, show_reported: verFinalizados, show_ready: listoParaLeer, show_no_image: verSinImagenes, bodypart_id: bodyPartId, modality_id: modalityId, study_group_id: studioTypeId, flag_filter: flagFilter.join(','), date_range: dateRange, date_field: dateField });
    const { gruposEstudio } = useGrupoEstudio();
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();
    const { presets, isLoading: isLoadingPresets } = useFilterPresets();

    // Función para toggle de columnas
    const toggleColumn = useCallback((columnKey: string) => {
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

    const handleUpdateFlags = useCallback((examId: string, flags: string[]) => {
        updateFlags({ examId, flags });
    }, [updateFlags]);

    const handleUpdateTagIds = useCallback((examId: string, tagIds: string[]) => {
        updateTagIds({ examId, tagIds });
    }, [updateTagIds]);

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

    // Todas las columnas disponibles (estáticas + banderas + tags)
    const allColumns = useMemo(() => [...informeColumns, flagsColumn, tagsColumn], [flagsColumn, tagsColumn]);

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
            setStudioTypeId(undefined);
            setModalityId(undefined);
            setBodyPartId(undefined);
            setVisibleColumns([...informeColumns.map(col => col.key as string), "flags", "tag_ids", "report_date"]);
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
            setStudioTypeId(f.study_group_id || undefined);
            setModalityId(f.modality_id || undefined);
            setBodyPartId(f.bodypart_id || undefined);
            const cols = f.visible_columns?.length ? f.visible_columns : [...informeColumns.map(col => col.key as string), "flags"];
            setVisibleColumns(cols.includes("report_date") ? cols : [...cols, "report_date"]);
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

    // Handler para cambio de preset desde las tabs
    const handlePresetChange = useCallback((preset: FilterPreset | null) => {
        applyPreset(preset);
    }, [applyPreset]);

    const handleSortChange = useCallback((column: string, direction: "asc" | "desc") => {
        setSortColumn(column);
        setSortDirection(direction);
    }, []);

    // Listener para eventos de actualización del visor
    useEffect(() => {
        const CHANNEL_NAME = 'informe-updates';
        const channel = new BroadcastChannel(CHANNEL_NAME);

        const handleViewerUpdate = (event: MessageEvent) => {
            console.log('📨 Mensaje recibido en Radiologia.tsx:', event.data);
            const { type, windowId, studyInstanceUid } = event.data;

            if (type === 'VIEWER_UPDATE') {
                console.log('🎯 Evento VIEWER_UPDATE detectado:', { windowId, studyInstanceUid });
                console.log('🗺️ Ventanas guardadas:', Array.from(viewerWindowsRef.current.keys()));

                if (windowId && studyInstanceUid) {
                    const viewerWindow = viewerWindowsRef.current.get(windowId);
                    console.log('🪟 Ventana encontrada:', viewerWindow ? 'Sí' : 'No');

                    if (viewerWindow && !viewerWindow.closed) {
                        console.log('🔄 Actualizando visor local con postMessage...');
                        console.log('🆔 Nuevo StudyInstanceUID:', studyInstanceUid);

                        try {
                            // Enviar postMessage al wrapper para que actualice el iframe
                            const newViewerUrl = `https://viewer.nextris.cloud/viewer?StudyInstanceUIDs=${studyInstanceUid}`;

                            console.log('📨 Enviando postMessage al wrapper...');
                            viewerWindow.postMessage(
                                {
                                    type: 'UPDATE_VIEWER',
                                    studyInstanceUid: studyInstanceUid,
                                    newUrl: newViewerUrl
                                },
                                window.location.origin
                            );
                            console.log('✅ Mensaje enviado al wrapper exitosamente');

                            // Dar foco a la ventana
                            viewerWindow.focus();
                        } catch (error) {
                            console.log('❌ Error al enviar mensaje:', error);
                        }
                    } else if (viewerWindow?.closed) {
                        console.log('⚠️ La ventana del visor está cerrada');
                        viewerWindowsRef.current.delete(windowId);
                    } else {
                        console.log('❌ No se encontró ventana del visor para windowId:', windowId);
                    }
                } else {
                    console.log('⚠️ Faltan datos:', { windowId, studyInstanceUid });
                }
            }
        };

        channel.addEventListener('message', handleViewerUpdate);
        console.log('👂 Listener registrado');

        return () => {
            console.log('🔌 Desconectando listener del visor');
            channel.removeEventListener('message', handleViewerUpdate);
            channel.close();
        };
    }, []);

    const pagination = {
        page: informesData?.data?.page || 1,
        pageSize: informesData?.data?.per_page || perPage,
        total: informesData?.data?.total || 0,
    };

    const handleRedactarInforme = async (informe: Informes) => {
        // Verificar si el informe está bloqueado por otro usuario
        if (informe.blocked_by && informe.blocked_by_name) {

            toast.error(`Este informe está siendo editado por ${informe.blocked_by_name}`);
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
        setIsBlocking(true);
        try {
            await blockExam(informe.guid);
            openReportWindow(informe);
        } catch (error) {
            // El error ya se maneja en el hook
            console.error('Error al bloquear el informe:', error);
        } finally {
            setIsBlocking(false);
        }
    };

    const openReportWindow = async (informe: Informes) => {
        const windowId = `report_window_${Date.now()}`;

        let url = `/estudios/redaccion/redactar-informe/${informe.guid}/${informe.study_instance_uid}?windowId=${windowId}&siguiente_paso=${siguientePaso}`;

        if (modalityId || bodyPartId || studioTypeId) {
            url = `/estudios/redaccion/redactar-informe/${informe.guid}/${informe.study_instance_uid}?windowId=${windowId}&modality_id=${modalityId}&bodypart_id=${bodyPartId}&study_group_id=${studioTypeId}&siguiente_paso=${siguientePaso}`;
        }

        localStorage.setItem(windowId, informe.guid);

        // Abrir visor de imágenes si el informe tiene imágenes
        let viewerWindow: Window | null = null;
        if (informe.is_image) {
            // Usar el wrapper en lugar del visor directo
            const viewerWrapperUrl = `/viewer-wrapper.html?StudyInstanceUIDs=${informe.study_instance_uid}`;

            viewerWindow = window.open(
                viewerWrapperUrl, // 👈 Ahora apunta al wrapper local
                `viewer_${windowId}`, // Usar un nombre único por windowId
                `toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no,width=1400,height=900,top=50,left=-1920,titlebar=no`
            );

            // Guardar referencia a la ventana del visor
            if (viewerWindow) {
                viewerWindowsRef.current.set(windowId, viewerWindow);
                console.log('📺 Ventana del visor guardada para windowId:', windowId);
                console.log('🗺️ Total de ventanas guardadas:', viewerWindowsRef.current.size);
                console.log('🔑 WindowIds guardados:', Array.from(viewerWindowsRef.current.keys()));
            } else {
                console.log('❌ No se pudo abrir la ventana del visor');
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
            // Cerrar ventana del visor si se abrió
            if (viewerWindow) {
                viewerWindow.close();
                viewerWindowsRef.current.delete(windowId);
            }
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

                // Cerrar ventana del visor si sigue abierta
                const viewerRef = viewerWindowsRef.current.get(windowId);
                if (viewerRef && !viewerRef.closed) {
                    viewerRef.close();
                }
                viewerWindowsRef.current.delete(windowId);
            }
        }, 300);
    };


    const handleViewImagenes = (informe: Informes) => {
        //abrir en otra pestaña
        window.open(
            `https://viewer.nextris.cloud/viewer?StudyInstanceUIDs=${informe.study_instance_uid}`,
            '_blank',
        );
    };
    const handleViewPdf = (informe: Informes) => {
        window.open(
            `http://148.230.72.8:5001/api/pdfs/${informe.pdf_path}`,
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
        return modalidades.data.map((modalidad: any) => ({
            value: modalidad.guid,
            label: modalidad.description
        }));
    }, [modalidades]);

    const bodyPartsOptions = useMemo(() => {
        if (!Array.isArray(bodyParts?.data)) return [];
        return bodyParts.data.map((bodyPart: any) => ({
            value: bodyPart.guid,
            label: bodyPart.description
        }));
    }, [bodyParts]);



    return (
        <MainLayout>
            <div className="bg-card backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10 h-full flex flex-col overflow-hidden">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2 ">
                    <div className="bg-brand-purple p-2  rounded-lg">
                        <HandHelping className="w-4 h-4 sm:w-6 sm:h-5 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">Redacción de reportes</h1>
                </div>

                {/* Pestañas de presets de filtros */}
                <FilterPresetTabs
                    activePresetId={activePresetId}
                    onPresetChange={handlePresetChange}
                    currentFilters={getCurrentFilters()}
                    filtersVisible={showFilters}
                    onToggleFilters={() => setShowFilters(prev => !prev)}
                />

                {/* Bloque unificado de filtros */}
                <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 mb-2 dark:bg-[#2a2e32] dark:border-gray-700">
                    {/* Sección de Filtros */}
                    <div className="flex flex-col gap-2 flex-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros</span>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="sm:min-w-[250px]">
                                <InputSearch
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    placeholder="Buscar paciente o historial..."
                                />
                            </div>
                            <Autocomplete
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
                    <div className="hidden sm:block w-px bg-gray-300 self-stretch" />
                    <div className="block sm:hidden h-px bg-gray-300" />

                    {/* Sección de Checkboxes */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-200">Opciones</span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                                    Ver finalizados
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
                                    Ver sin imágenes
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Separador vertical */}
                    <div className="hidden sm:block w-px bg-gray-300 self-stretch" />
                    <div className="block sm:hidden h-px bg-gray-300" />

                    {/* Sección de Banderas */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-300">Banderas</span>
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
                                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-all focus:outline-none
                                            ${active ? "bg-gray-200 ring-1 ring-gray-400 scale-110 dark:bg-gray-700 dark:ring-gray-500" : "opacity-35 hover:opacity-70 dark:opacity-35 dark:hover:opacity-70"}`}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24"
                                            fill={svgFill[color]} stroke={svgStroke[color]}
                                            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="4" y1="2" x2="4" y2="22" />
                                            <polyline points="4,2 20,9 4,16" />
                                        </svg>
                                        <span className="text-[9px] text-gray-500 leading-none dark:text-gray-300">{label[color]}</span>
                                    </button>
                                );
                            })}
                            {flagFilter.length > 0 && (
                                <button
                                    onClick={() => { setFlagFilter([]); setPage(1); }}
                                    className="text-xs text-gray-400 hover:text-gray-600 ml-1 self-start mt-1 dark:text-gray-400 dark:hover:text-gray-200"
                                    title="Limpiar filtro de banderas"
                                >✕</button>
                            )}
                        </div>
                    </div>

                    {/* Separador vertical */}
                    <div className="hidden sm:block w-px bg-gray-300 self-stretch" />
                    <div className="block sm:hidden h-px bg-gray-300" />

                    {/* Sección de Fechas */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fechas</span>
                        <div className="flex gap-2">
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
                                    <SelectValue placeholder="Hace >" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todo</SelectItem>
                                    <SelectItem value="1d">Hace &gt; 1 día</SelectItem>
                                    <SelectItem value="3d">Hace &gt; 3 días</SelectItem>
                                    <SelectItem value="7d">Hace &gt; 7 días</SelectItem>
                                    <SelectItem value="14d">Hace &gt; 14 días</SelectItem>
                                    <SelectItem value="1m">Hace &gt; 1 mes</SelectItem>
                                    <SelectItem value="2m">Hace &gt; 2 meses</SelectItem>
                                    <SelectItem value="3m">Hace &gt; 3 meses</SelectItem>
                                    <SelectItem value="1y">Hace &gt; 1 año</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                </div>
                </div>

                <TablaDynamic<Informes>
                    data={(informesData?.data?.data) || []}
                    columns={filteredColumns}
                    showIndex
                    loading={isLoadingInformes}
                    pagination={pagination}
                    actions={getInformesActions(handleRedactarInforme, handleViewImagenes, handleViewPdf)}
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
                    tableBackgroundImage={fondoImage}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    additionalControls={
                        <div className="flex items-center gap-4">
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