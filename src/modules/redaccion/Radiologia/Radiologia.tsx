import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import { MainLayout } from "@/layouts/layout"
import { HandHelping, RefreshCcw, Loader2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useInformes, useBlockExam, useUnblockExam } from "./hooks/use-informes"
import { getInformesActions, informeColumns } from "./components/columns"
import TablaDynamic from "@/components/TableDynamic"
import type { Informes } from "./types/informes.types"
import { useDebounce } from "@uidotdev/usehooks"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { PrimaryButton } from "@/components"
import { toast } from "sonner"
import { ConfirmationModal } from "./components/ConfirmationModal"
import { Autocomplete } from "@/components/autocomplete"
import { useBodyParts } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo"
import { useModalidades } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades"
import { useGrupoEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/grupos-estudio"

export const Radiologia = () => {
    const [studioTypeId, setStudioTypeId] = useState<string | undefined>(undefined);
    const [bodyPartId, setBodyPartId] = useState<string | undefined>(undefined);
    const [modalityId, setModalityId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [verFinalizados, setVerFinalizados] = useState(false);
    const [asignadosAMi, setAsignadosAMi] = useState(false);
    const [listoParaLeer, setListoParaLeer] = useState(true);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedInforme, setSelectedInforme] = useState<Informes | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const useDebounceSearch = useDebounce(searchTerm, 500);
    const { mutateAsync: blockExam } = useBlockExam();
    const { mutateAsync: unblockExam } = useUnblockExam();
    const { informesData, isLoading: isLoadingInformes, refetchInformes } = useInformes({ page, per_page: 8, search: useDebounceSearch, show_reported: verFinalizados, show_ready: listoParaLeer, bodypart_id: bodyPartId, modality_id: modalityId, study_group_id: studioTypeId });
    const { gruposEstudio } = useGrupoEstudio();
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();

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
        let url = `/redaccion/radiologia/redactar-informe/${informe.guid}/${informe.study_instance_uid}`;

        if (modalityId || bodyPartId || studioTypeId) {
            url = `/redaccion/radiologia/redactar-informe/${informe.guid}/${informe.study_instance_uid}?modality_id=${modalityId}&bodypart_id=${bodyPartId}&study_group_id=${studioTypeId}`;
        }
        // 2️⃣ Abrir ventana Y GUARDAR LA REFERENCIA
        const reportWindow = window.open(
            url,
            "_blank",
            "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no,width=1400,height=900,top=50,left=100,titlebar=no"
        );

        // 3️⃣ Si el navegador bloquea el popup
        if (!reportWindow) {
            await unblockExam(informe.guid);
            return;
        }

        // 4️⃣ Detectar cuando se cierra
        const interval = setInterval(async () => {
            if (reportWindow.closed) {
                clearInterval(interval);
                await unblockExam(informe.guid);
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
                                    onCheckedChange={(checked) => setListoParaLeer(checked as boolean)}
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
                                    onCheckedChange={(checked) => setVerFinalizados(checked as boolean)}
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
                                onCheckedChange={(checked) => setAsignadosAMi(checked as boolean)}
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
                        onValueChange={setStudioTypeId}
                        placeholder="Filtrar por grupo de estudio"
                        emptyMessage="No se encontraron grupos de estudio."
                        searchPlaceholder="Buscar grupo de estudio..."
                    />

                    {/* Filtro por modalidad */}
                    <Autocomplete
                        options={modalidadesOptions}
                        value={modalityId}
                        onValueChange={setModalityId}
                        placeholder="Filtrar por modalidad"
                        emptyMessage="No se encontraron modalidades."
                        searchPlaceholder="Buscar modalidad..."
                    />

                    {/* Filtro por parte del cuerpo */}
                    <Autocomplete
                        options={bodyPartsOptions}
                        value={bodyPartId || ''}
                        onValueChange={setBodyPartId}
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
                        columns={informeColumns}
                        showIndex
                        pagination={pagination}
                        actions={getInformesActions(handleRedactarInforme, handleViewImagenes, handleViewPdf)}
                        onPaginationChange={(newPage) => {
                            setPage(newPage);
                        }}
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
