import { Archive, Image, Link2, RefreshCw, Loader2, ChevronLeft, ChevronRight, Search, ArrowRight, CheckCircle2, ScanLine } from "lucide-react"
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

    const bothSelected = selectedEstudio && selectedOrden;

    return (
        <>
            {/* Selector de dirección */}
            <div className="mb-5">
                <DireccionSelector
                    selectedDireccion={selectedDireccion}
                    onDireccionChange={handleDireccionChange}
                    isRow={true}
                />
            </div>

            {selectedDireccion && (
                <div className="flex flex-col gap-4">
                    {/* Grilla de dos paneles */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* ── PANEL IZQUIERDO: Estudios Sin Vincular ── */}
                        <div className="flex flex-col rounded-xl overflow-hidden border border-purple-200 dark:border-purple-900 shadow-sm">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-brand-purple to-purple-700 px-5 py-4 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/15 p-2 rounded-lg">
                                            <Archive className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold leading-tight">Estudios Sin Vincular</h2>
                                            <p className="text-xs text-white/70 mt-0.5">DICOM sin orden asignada</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                            {estudiosNoVinculadosData?.data?.total ?? 0}
                                        </span>
                                        <button
                                            onClick={() => refetchEstudiosNoVinculados()}
                                            disabled={isLoading}
                                            className="bg-white/15 hover:bg-white/25 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                            title="Actualizar"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla */}
                            <div className="flex-1 flex flex-col bg-white dark:bg-[#2a2e32]">
                                {/* Cabecera tabla */}
                                <div className="grid grid-cols-3 px-4 py-2.5 bg-gray-50 dark:bg-[#23272b] border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Paciente</span>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mod</span>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha</span>
                                </div>

                                {/* Filas */}
                                <div className="flex-1 overflow-y-auto" style={{ maxHeight: '360px' }}>
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 className="w-7 h-7 animate-spin text-brand-purple/60" />
                                        </div>
                                    ) : totalEstudios === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
                                                <Archive className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm">No hay estudios sin vincular</p>
                                        </div>
                                    ) : (
                                        estudiosActuales.map((estudio) => {
                                            const isSelected = selectedEstudio?.guid === estudio.guid;
                                            return (
                                                <div
                                                    key={estudio.guid}
                                                    onClick={() => handleEstudioClick(estudio)}
                                                    className={`grid grid-cols-3 px-4 py-3 cursor-pointer transition-all border-b border-gray-100 dark:border-gray-700/60 group
                                                        ${isSelected
                                                            ? 'bg-brand-purple/10 dark:bg-purple-900/30 border-l-2 border-l-brand-purple'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-purple flex-shrink-0" />}
                                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{estudio.patient_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-block text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-brand-purple dark:text-purple-300 px-2 py-0.5 rounded-md">
                                                            {estudio.modality}
                                                        </span>
                                                        {estudio.instance_count > 1 && (
                                                            <span className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md">
                                                                {estudio.instance_count}i
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center">{formatDate(estudio.study_date)}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Paginación */}
                                {totalPaginasEstudios > 1 && (
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-[#23272b] border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {((estudiosPagina - 1) * estudiosPerPage) + 1}–{Math.min(estudiosPagina * estudiosPerPage, totalEstudios)} de {totalEstudios}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button onClick={() => setEstudiosPagina(p => Math.max(1, p - 1))} disabled={estudiosPagina === 1} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                            </Button>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[48px] text-center">{estudiosPagina} / {totalPaginasEstudios}</span>
                                            <Button onClick={() => setEstudiosPagina(p => Math.min(totalPaginasEstudios, p + 1))} disabled={estudiosPagina === totalPaginasEstudios} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── PANEL DERECHO: Órdenes Sin Imagen ── */}
                        <div className="flex flex-col rounded-xl overflow-hidden border border-cyan-200 dark:border-cyan-900 shadow-sm">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-4 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/15 p-2 rounded-lg">
                                            <ScanLine className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold leading-tight">Órdenes Sin Imagen</h2>
                                            <p className="text-xs text-white/70 mt-0.5">Exámenes sin DICOM asociado</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                            {ordenesSinImagenData?.data?.total ?? 0}
                                        </span>
                                        <button
                                            onClick={() => refetchOrdenesSinImagen()}
                                            disabled={isLoadingOrdenes}
                                            className="bg-white/15 hover:bg-white/25 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                            title="Actualizar"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrdenes ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Buscadores integrados en el header */}
                                <div className="flex gap-2 mt-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
                                        <input
                                            placeholder="Buscar por nombre..."
                                            className="w-full bg-white/15 placeholder-white/50 text-white text-xs pl-8 pr-3 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
                                            value={searchName}
                                            onChange={(e) => handleSearchNameChange(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative w-28">
                                        <input
                                            placeholder="DNI..."
                                            className="w-full bg-white/15 placeholder-white/50 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
                                            value={searchDNI}
                                            onChange={(e) => handleSearchDNIChange(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tabla */}
                            <div className="flex-1 flex flex-col bg-white dark:bg-[#2a2e32]">
                                {/* Cabecera tabla */}
                                <div className="grid grid-cols-4 px-4 py-2.5 bg-gray-50 dark:bg-[#23272b] border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Paciente</span>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide col-span-1">Estudio</span>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ACC</span>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha</span>
                                </div>

                                {/* Filas */}
                                <div className="flex-1 overflow-y-auto" style={{ maxHeight: '360px' }}>
                                    {isLoadingOrdenes ? (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 className="w-7 h-7 animate-spin text-cyan-500/60" />
                                        </div>
                                    ) : totalOrdenes === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
                                                <Image className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm">No hay órdenes sin imagen</p>
                                        </div>
                                    ) : (
                                        ordenesActuales.map((orden) => {
                                            const isSelected = selectedOrden?.guid === orden.guid;
                                            return (
                                                <div
                                                    key={orden.guid}
                                                    onClick={() => handleOrdenClick(orden)}
                                                    className={`grid grid-cols-4 px-4 py-3 cursor-pointer transition-all border-b border-gray-100 dark:border-gray-700/60 group
                                                        ${isSelected
                                                            ? 'bg-cyan-50 dark:bg-cyan-900/20 border-l-2 border-l-cyan-500'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />}
                                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{orden.patient_name}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate self-center" title={orden.study_type}>{orden.study_type}</span>
                                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-300 self-center">{orden.accession}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center">{formatDate(orden.date)}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Paginación */}
                                {totalPaginasOrdenes > 1 && (
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-[#23272b] border-t border-gray-200 dark:border-gray-700">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {((ordenesPagina - 1) * ordenesPerPage) + 1}–{Math.min(ordenesPagina * ordenesPerPage, totalOrdenes)} de {totalOrdenes}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button onClick={() => setOrdenesPagina(p => Math.max(1, p - 1))} disabled={ordenesPagina === 1} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                            </Button>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[48px] text-center">{ordenesPagina} / {totalPaginasOrdenes}</span>
                                            <Button onClick={() => setOrdenesPagina(p => Math.min(totalPaginasOrdenes, p + 1))} disabled={ordenesPagina === totalPaginasOrdenes} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── BARRA DE VINCULACIÓN ── */}
                    <div className={`rounded-xl border-2 transition-all duration-300 overflow-hidden
                        ${bothSelected
                            ? 'border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10 shadow-md'
                            : 'border-dashed border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-[#23272b]/50'
                        }`}
                    >
                        {bothSelected ? (
                            /* Muestra las selecciones cuando ambas están elegidas */
                            <div className="px-5 py-4 flex flex-col sm:flex-row items-center gap-4">
                                {/* Estudio seleccionado */}
                                <div className="flex-1 bg-white dark:bg-[#2a2e32] rounded-lg px-4 py-2.5 border border-purple-200 dark:border-purple-800">
                                    <p className="text-xs text-brand-purple font-semibold mb-0.5 flex items-center gap-1">
                                        <Archive className="w-3 h-3" /> Estudio
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{selectedEstudio.patient_name}</p>
                                    <p className="text-xs text-gray-400">{selectedEstudio.modality} · {formatDate(selectedEstudio.study_date)}</p>
                                </div>

                                {/* Flecha */}
                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-purple text-white flex-shrink-0 shadow-md">
                                    <ArrowRight className="w-4 h-4" />
                                </div>

                                {/* Orden seleccionada */}
                                <div className="flex-1 bg-white dark:bg-[#2a2e32] rounded-lg px-4 py-2.5 border border-cyan-200 dark:border-cyan-800">
                                    <p className="text-xs text-cyan-600 font-semibold mb-0.5 flex items-center gap-1">
                                        <ScanLine className="w-3 h-3" /> Orden
                                    </p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{selectedOrden.patient_name}</p>
                                    <p className="text-xs text-gray-400 truncate">{selectedOrden.study_type} · {selectedOrden.accession}</p>
                                </div>

                                {/* Botón vincular */}
                                <Button
                                    onClick={handleVincular}
                                    className="bg-brand-purple hover:bg-brand-purple/90 text-white px-5 py-2.5 h-auto flex items-center gap-2 flex-shrink-0 shadow-md"
                                >
                                    <Link2 className="w-4 h-4" />
                                    Vincular
                                </Button>
                            </div>
                        ) : (
                            /* Estado vacío / instrucción */
                            <div className="flex items-center justify-center gap-3 px-5 py-5 text-gray-400 dark:text-gray-500">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors
                                        ${selectedEstudio ? 'border-brand-purple text-brand-purple bg-brand-purple/10' : 'border-gray-300 dark:border-gray-600'}`}>
                                        1
                                    </span>
                                    <span className={selectedEstudio ? 'text-brand-purple font-medium' : ''}>
                                        {selectedEstudio ? selectedEstudio.patient_name : 'Selecciona un estudio (izquierda)'}
                                    </span>
                                </div>
                                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors
                                        ${selectedOrden ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-gray-300 dark:border-gray-600'}`}>
                                        2
                                    </span>
                                    <span className={selectedOrden ? 'text-cyan-600 font-medium' : ''}>
                                        {selectedOrden ? selectedOrden.patient_name : 'Selecciona una orden (derecha)'}
                                    </span>
                                </div>
                                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                                    <span>Vincular</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
