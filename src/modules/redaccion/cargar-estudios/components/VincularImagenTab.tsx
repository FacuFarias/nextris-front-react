import { Archive, Image, Link2, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DireccionSelector, PrimaryButton, SecondaryButton } from "@/components"
import { useState, useMemo } from "react"
import { useEstudiosNoVinculados, useSearchExams, useVincularEstudio } from "../hooks/use-cargar-estudios"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@fullcalendar/core/index.js"



export const VincularImagenTab = () => {
    const [selectedDireccion, setSelectedDireccion] = useState<string>("");
    const [selectedEstudio, setSelectedEstudio] = useState<any>(null);
    const [selectedOrden, setSelectedOrden] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchName, setSearchName] = useState("");
    const [searchDNI, setSearchDNI] = useState("");

    // Paginación para estudios
    const [estudiosPagina, setEstudiosPagina] = useState(1);
    const [estudiosPerPage] = useState(10);

    // Paginación para órdenes
    const [ordenesPagina, setOrdenesPagina] = useState(1);
    const [ordenesPerPage] = useState(10);


    const { estudiosNoVinculadosData, isLoading, refetchEstudiosNoVinculados } = useEstudiosNoVinculados({ location_id: selectedDireccion });
    const { ordenesSinImagenData, isLoading: isLoadingOrdenes, refetchOrdenesSinImagen } = useSearchExams({ location_id: selectedDireccion });
    const { mutate: vincularEstudio } = useVincularEstudio();

    // Datos paginados para estudios
    const estudiosData = estudiosNoVinculadosData?.data?.data || [];
    const totalEstudios = estudiosData.length;
    const totalPaginasEstudios = Math.ceil(totalEstudios / estudiosPerPage);
    const estudiosActuales = useMemo(() => {
        const inicio = (estudiosPagina - 1) * estudiosPerPage;
        const fin = inicio + estudiosPerPage;
        return estudiosData.slice(inicio, fin);
    }, [estudiosData, estudiosPagina, estudiosPerPage]);

    // Datos paginados para órdenes (con filtro)
    const ordenesFiltradas = useMemo(() => {
        return ordenesSinImagenData?.data?.data?.filter((orden) => {
            const matchName = !searchName || orden.patient_name.toLowerCase().includes(searchName.toLowerCase());
            const matchDNI = !searchDNI || orden.patient_id.includes(searchDNI);
            return matchName && matchDNI;
        }) || [];
    }, [ordenesSinImagenData, searchName, searchDNI]);

    const totalOrdenes = ordenesFiltradas.length;
    const totalPaginasOrdenes = Math.ceil(totalOrdenes / ordenesPerPage);
    const ordenesActuales = useMemo(() => {
        const inicio = (ordenesPagina - 1) * ordenesPerPage;
        const fin = inicio + ordenesPerPage;
        return ordenesFiltradas.slice(inicio, fin);
    }, [ordenesFiltradas, ordenesPagina, ordenesPerPage]);

    const handleDireccionChange = (direccionId: string) => {
        setSelectedDireccion(direccionId);
        setSelectedEstudio(null);
        setSelectedOrden(null);
        setEstudiosPagina(1);
        setOrdenesPagina(1);
    };

    const handleEstudioClick = (estudio: any) => {
        setSelectedEstudio(estudio);
    };

    const handleOrdenClick = (orden: any) => {
        setSelectedOrden(orden);
    };

    const handleVincular = () => {
        if (selectedEstudio && selectedOrden) {
            setIsModalOpen(true);
        }
    };
    const handleSubmitVinculacion = () => {
        if (selectedEstudio && selectedOrden) {
            const data = {
                upload_guid: selectedEstudio.guid,
                examination_guid: selectedOrden.guid,
            };

            vincularEstudio(data, {
                onSuccess: () => {
                    refetchEstudiosNoVinculados();
                    refetchOrdenesSinImagen();
                    setIsModalOpen(false);
                    setEstudiosPagina(1);
                    setOrdenesPagina(1);
                    setSelectedEstudio(null);
                    setSelectedOrden(null);
                }
            });
        }
    };

    // Resetear a página 1 cuando se cambian los filtros
    const handleSearchNameChange = (value: string) => {
        setSearchName(value);
        setOrdenesPagina(1);
    };

    const handleSearchDNIChange = (value: string) => {
        setSearchDNI(value);
        setOrdenesPagina(1);
    };
    return (
        <>
            <div className="mb-2">
                <DireccionSelector
                    selectedDireccion={selectedDireccion}
                    onDireccionChange={handleDireccionChange}
                    isRow={true}
                />
            </div>
            {selectedDireccion && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* TARJETA 1: Estudios Cargados Sin Vincular */}
                        <div className="bg-white dark:bg-[#2a2e32] rounded-lg shadow-lg overflow-hidden">
                            {/* Header Morado */}
                            <div className="bg-brand-purple p-6 text-white mb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <Archive className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Estudios Cargados Sin Vincular</h2>
                                            <p className="text-sm text-white/80 mt-1">Estudios DICOM que aún no están vinculados a ninguna orden</p>
                                        </div>
                                    </div>


                                    <Badge className="bg-red-500 text-white px-3 py-1 text-sm font-bold">
                                        {estudiosNoVinculadosData?.data?.total || 0}
                                    </Badge>
                                </div>
                            </div>

                            {/* Contenido Blanco */}
                            <div className="">
                                <Button
                                    onClick={() => refetchEstudiosNoVinculados()}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto bg-brand-purple hover:bg-brand-purple/90 text-white mb-6"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                    ACTUALIZAR
                                </Button>

                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-brand-purple text-white font-semibold text-sm">
                                        <div>PACIENTE</div>
                                        <div>MOD</div>
                                        <div>FECHA</div>
                                    </div>
                                    {isLoading ? (
                                        <div className="p-12 text-center bg-gray-50 dark:bg-[#2a2e32]">
                                            <Loader2 className="w-8 h-8 animate-spin text-brand-purple dark:text-purple-400 mx-auto" />
                                        </div>
                                    ) : totalEstudios === 0 ? (
                                        <div className="p-12 text-center bg-gray-50 dark:bg-[#2a2e32]">
                                            <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                                                <Archive className="w-12 h-12" />
                                                <p className="text-sm">No hay estudios sin vincular</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="max-h-96 overflow-y-auto">
                                                {estudiosActuales.map((estudio) => (
                                                    <div
                                                        key={estudio.guid}
                                                        onClick={() => handleEstudioClick(estudio)}
                                                        className={`grid grid-cols-3 gap-4 p-4 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors border-b border-gray-100 dark:border-gray-700 ${selectedEstudio?.guid === estudio.guid ? 'bg-purple-100 dark:bg-purple-900/50 border-l-4 border-l-brand-purple dark:border-l-purple-400' : ''
                                                            }`}
                                                    >
                                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{estudio.patient_name}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">{estudio.modality}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(estudio.study_date)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Paginación de Estudios */}
                                            {totalPaginasEstudios > 1 && (
                                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#2a2e32] border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Mostrando {((estudiosPagina - 1) * estudiosPerPage) + 1} - {Math.min(estudiosPagina * estudiosPerPage, totalEstudios)} de {totalEstudios}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={() => setEstudiosPagina(prev => Math.max(1, prev - 1))}
                                                            disabled={estudiosPagina === 1}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </Button>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {estudiosPagina} / {totalPaginasEstudios}
                                                        </span>
                                                        <Button
                                                            onClick={() => setEstudiosPagina(prev => Math.min(totalPaginasEstudios, prev + 1))}
                                                            disabled={estudiosPagina === totalPaginasEstudios}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TARJETA 2: Órdenes Sin Imagen */}
                        <div className="bg-white dark:bg-[#2a2e32] rounded-lg shadow-lg overflow-hidden">
                            {/* Header Morado */}
                            <div className="bg-brand-purple p-6 text-white">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <Image className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">Órdenes Sin Imagen</h2>
                                            <p className="text-sm text-white/80 mt-1">Órdenes/exámenes que no tienen imágenes DICOM asociadas</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-cyan-400 text-white px-3 py-1 text-sm font-bold">
                                        {ordenesSinImagenData?.data?.total || 0}
                                    </Badge>
                                </div>
                            </div>

                            {/* Contenido Blanco */}
                            <div className="p-6">
                                <div className="flex gap-2 mb-6">
                                    <Input
                                        placeholder="Buscar por nombre..."
                                        className="border-gray-300"
                                        value={searchName}
                                        onChange={(e) => handleSearchNameChange(e.target.value)}
                                    />
                                    <Input
                                        placeholder="DNI..."
                                        className="border-gray-300 w-32"
                                        value={searchDNI}
                                        onChange={(e) => handleSearchDNIChange(e.target.value)}
                                    />
                                    <Button
                                        onClick={() => refetchOrdenesSinImagen()}
                                        disabled={isLoadingOrdenes}
                                        className="bg-brand-purple hover:bg-brand-purple/90 text-white"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoadingOrdenes ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>

                                {/* Tabla */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-4 gap-4 p-4 bg-brand-purple text-white font-semibold text-sm">
                                        <div>PACIENTE</div>
                                        <div>ESTUDIO</div>
                                        <div>ACC</div>
                                        <div>FECHA</div>
                                    </div>
                                    {isLoadingOrdenes ? (
                                        <div className="p-12 text-center bg-gray-50 dark:bg-[#2a2e32]">
                                            <Loader2 className="w-8 h-8 animate-spin text-brand-purple dark:text-purple-400 mx-auto" />
                                        </div>
                                    ) : totalOrdenes === 0 ? (
                                        <div className="p-12 text-center bg-gray-50 dark:bg-[#2a2e32]">
                                            <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                                                <Image className="w-12 h-12" />
                                                <p className="text-sm">No hay órdenes sin imagen</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="max-h-96 overflow-y-auto">
                                                {ordenesActuales.map((orden) => (
                                                    <div
                                                        key={orden.guid}
                                                        onClick={() => handleOrdenClick(orden)}
                                                        className={`grid grid-cols-4 gap-4 p-4 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors border-b border-gray-100 dark:border-gray-700 ${selectedOrden?.guid === orden.guid ? 'bg-purple-100 dark:bg-purple-900/50 border-l-4 border-l-brand-purple dark:border-l-purple-400' : ''
                                                            }`}
                                                    >
                                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{orden.patient_name}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate" title={orden.study_type}>{orden.study_type}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">{orden.accession}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(orden.date)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Paginación de Órdenes */}
                                            {totalPaginasOrdenes > 1 && (
                                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#2a2e32] border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Mostrando {((ordenesPagina - 1) * ordenesPerPage) + 1} - {Math.min(ordenesPagina * ordenesPerPage, totalOrdenes)} de {totalOrdenes}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={() => setOrdenesPagina(prev => Math.max(1, prev - 1))}
                                                            disabled={ordenesPagina === 1}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </Button>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {ordenesPagina} / {totalPaginasOrdenes}
                                                        </span>
                                                        <Button
                                                            onClick={() => setOrdenesPagina(prev => Math.min(totalPaginasOrdenes, prev + 1))}
                                                            disabled={ordenesPagina === totalPaginasOrdenes}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección de vinculación */}
                    <div className="mt-8 bg-white/50 dark:bg-[#2a2e32] backdrop-blur-sm rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <Archive className="w-5 h-5 text-orange-600" />
                            </div>
                            <p className="text-sm font-medium">Selecciona un estudio cargado (izquierda) y una orden sin imagen (derecha) para vincularlos</p>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button
                                onClick={handleVincular}
                                disabled={!selectedEstudio || !selectedOrden}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Link2 className="w-4 h-4 mr-2" />
                                Vincular Estudio Seleccionado
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Modal de confirmación */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl dark:bg-[#2a2e32] dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-brand-purple dark:text-purple-400">Confirmar Vinculación</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Revisa los datos antes de vincular el estudio con la orden
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Datos del Estudio */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                            <h3 className="font-bold text-brand-purple dark:text-purple-400 mb-3 flex items-center gap-2">
                                <Archive className="w-5 h-5" />
                                Estudio Cargado
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-semibold dark:text-gray-200">Paciente:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedEstudio?.patient_name}</p>
                                </div>
                                <div>
                                    <span className="font-semibold dark:text-gray-200">DNI:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedEstudio?.patient_id}</p>
                                </div>
                                <div>
                                    <span className="font-semibold dark:text-gray-200">Modalidad:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedEstudio?.modality}</p>
                                </div>
                                <div>
                                    <span className="font-semibold dark:text-gray-200">Descripción:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedEstudio?.study_description}</p>
                                </div>
                                <div>
                                    <span className="font-semibold dark:text-gray-200">Fecha:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedEstudio && formatDate(selectedEstudio.study_date)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Datos de la Orden */}
                        <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-700">
                            <h3 className="font-bold text-cyan-700 dark:text-cyan-400 mb-3 flex items-center gap-2">
                                <Image className="w-5 h-5" />
                                Orden Sin Imagen
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="font-semibold dark:text-gray-200">Paciente:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedOrden?.patient_name}</p>
                                </div>
                                <div>
                                    <span className="font-semibold dark:text-gray-200">DNI:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedOrden?.patient_id}</p>
                                </div>
                                <div>
                                    <span className="font-semibold dark:text-gray-200">Tipo de Estudio:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedOrden?.study_type}</p>
                                </div>
                                <div>
                                    <span className="font-semibold dark:text-gray-200">Accession:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedOrden?.accession}</p>
                                </div>
                                <div>
                                    <span className="font-semibold dark:text-gray-200">Fecha:</span>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedOrden && formatDate(selectedOrden.date)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={handleSubmitVinculacion}
                        >
                            <Link2 className="w-4 h-4 mr-2" />
                            Confirmar Vinculación
                        </PrimaryButton>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
