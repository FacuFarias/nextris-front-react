import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import { MainLayout } from "@/layouts/layout"
import { HandHelping, RefreshCcw, Loader2 } from "lucide-react"
import { useMemo, useState, useEffect, useRef } from "react"
import { useInformes, useBlockExam, useUnblockExam } from "./hooks/use-informes"
import { useCrossWindowSync } from "./redactar-informe/hooks/use-cross-windows"
import { getInformesActions, informeColumns } from "./components/columns"
import TablaDynamic from "@/components/TableDynamic"
import type { Informes } from "./types/informes.types"
import { useDebounce } from "@uidotdev/usehooks"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PrimaryButton } from "@/components"
import { toast } from "sonner"
import { ConfirmationModal } from "./components/ConfirmationModal"
import { Autocomplete } from "@/components/autocomplete"
import { useBodyParts } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo"
import { useModalidades } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades"
import { useGrupoEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/grupos-estudio"

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
    const [siguientePaso, setSiguientePaso] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isNoImageModalOpen, setIsNoImageModalOpen] = useState(false);
    const [selectedInforme, setSelectedInforme] = useState<Informes | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        informeColumns.map(col => col.key as string)
    );
    const useDebounceSearch = useDebounce(searchTerm, 500);
    const { mutateAsync: blockExam } = useBlockExam();
    const { mutateAsync: unblockExam } = useUnblockExam();
    const { informesData, isLoading: isLoadingInformes, refetchInformes } = useInformes({ page, per_page: perPage, search: useDebounceSearch, show_reported: verFinalizados, show_ready: listoParaLeer, bodypart_id: bodyPartId, modality_id: modalityId, study_group_id: studioTypeId });
    const { gruposEstudio } = useGrupoEstudio();
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();

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

    const pagination = informesData && {
        page: informesData?.data?.page || 1,
        pageSize: informesData?.data?.per_page || 5,
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

    const filteredColumns = useMemo(() => {
        return informeColumns.filter(col => visibleColumns.includes(col.key as string));
    }, [visibleColumns]);

    const toggleColumn = (columnKey: string) => {
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
    };
    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <HandHelping className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Redacción de reportes</h1>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4  mb-4 sm:mb-2">
                    <div className="flex-1">
                        <InputSearch
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            placeholder="Buscar paciente o historial..."
                        />
                    </div>

                    {/* Filtros con checkboxes */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="listo-leer"
                                    checked={listoParaLeer}
                                    onCheckedChange={(checked) => {
                                        setListoParaLeer(checked as boolean);
                                        setPage(1);
                                    }}
                                    className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple"
                                />
                                <Label
                                    htmlFor="listo-leer"
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
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
                                    className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple"
                                />
                                <Label
                                    htmlFor="finalizados"
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                    Ver finalizados
                                </Label>
                            </div>

                        </div>


                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="asignados"
                                checked={asignadosAMi}
                                onCheckedChange={(checked) => {
                                    setAsignadosAMi(checked as boolean);
                                    setPage(1);
                                }}
                                className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple"
                            />
                            <Label
                                htmlFor="asignados"
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                                Asignados a mí
                            </Label>
                        </div>

                        <PrimaryButton onClick={() => {
                            refetchInformes();
                            toast.success('Lista actualizada exitosamente');
                        }}>
                            <div className="flex items-center">
                                <RefreshCcw className="h-4 w-4" />
                            </div>
                        </PrimaryButton>

                    </div>
                </div>
                <div className="w-full flex flex-col sm:flex-row gap-3 ">
                    <Autocomplete
                        options={gruposEstudioOptions}
                        value={studioTypeId}
                        onValueChange={(value) => {
                            setStudioTypeId(value);
                            setPage(1);
                        }}
                        placeholder="Filtrar por grupo de estudio"
                        emptyMessage="No se encontraron grupos de estudio."
                        searchPlaceholder="Buscar grupo de estudio..."
                    />

                    {/* Filtro por modalidad */}
                    <Autocomplete
                        options={modalidadesOptions}
                        value={modalityId}
                        onValueChange={(value) => {
                            setModalityId(value);
                            setPage(1);
                        }}
                        placeholder="Filtrar por modalidad"
                        emptyMessage="No se encontraron modalidades."
                        searchPlaceholder="Buscar modalidad..."
                    />

                    {/* Filtro por parte del cuerpo */}
                    <Autocomplete
                        options={bodyPartsOptions}
                        value={bodyPartId || ''}
                        onValueChange={(value) => {
                            setBodyPartId(value);
                            setPage(1);
                        }}
                        placeholder="Filtrar por parte del cuerpo"
                        emptyMessage="No se encontraron partes del cuerpo."
                        searchPlaceholder="Buscar parte del cuerpo..."
                    />
                </div>

                {/* Resultados */}
                <div className="mt-2">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700">Resultados</h2>
                </div>

                {isLoadingInformes ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : (
                    <TablaDynamic<Informes>
                        data={(informesData?.data?.data) || []}
                        columns={filteredColumns}
                        showIndex
                        pagination={pagination}
                        actions={getInformesActions(handleRedactarInforme, handleViewImagenes, handleViewPdf)}
                        onPaginationChange={(newPage) => {
                            setPage(newPage);
                        }}
                        maxHeight="600px"
                        perPageValue={perPage}
                        onPerPageChange={(value) => {
                            setPerPage(value);
                            setPage(1);
                        }}
                        allColumns={informeColumns}
                        visibleColumns={visibleColumns}
                        onToggleColumn={toggleColumn}
                        additionalControls={
                            <div className="flex items-center gap-2">
                                <Label htmlFor="siguiente-paso-toggle" className="text-sm font-medium text-gray-700">
                                    Siguiente paso:
                                </Label>
                                <Switch
                                    id="siguiente-paso-toggle"
                                    checked={siguientePaso}
                                    onCheckedChange={setSiguientePaso}
                                />
                            </div>
                        }
                    />
                )}


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