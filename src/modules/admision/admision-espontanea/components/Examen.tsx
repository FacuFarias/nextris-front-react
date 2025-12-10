import { User, ClipboardList, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente"
import { useState } from "react";
import { useEquiposPorLocacion, useEstudiosPorModalidad, useModalidades, usePartesDelCuerpo } from "@/hooks/use-global";

interface ExamenProps {
    selectedPatient: Patient | null;
    selectedDireccion: string;
    onEquipoSelected?: (equipo: any, estudio: any) => void;
}

export const Examen = ({
    selectedPatient,
    selectedDireccion,
    onEquipoSelected,
}: ExamenProps) => {
    const [selectedTipoExamen, setSelectedTipoExamen] = useState<string>("");
    const [selectedParteCuerpo, setSelectedParteCuerpo] = useState<string>("");
    const [selectedEstudio, setSelectedEstudio] = useState<any>(null);
    const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { data: tiposExamenData, isLoading: isLoadingTiposExamen } = useModalidades();
    const { data: partesDelCuerpoData, isLoading: isLoadingPartesCuerpo } = usePartesDelCuerpo();
    const { data: estudiosData, isLoading: isLoadingEstudios } = useEstudiosPorModalidad();

    const { data: equiposData, isLoading: isLoadingEquipos } = useEquiposPorLocacion(
        selectedEstudio ? selectedDireccion : ""
    );
    // Filtrar equipos por modalidad del estudio seleccionado
    const filteredEquipos = equiposData?.filter((equipo: any) =>
        equipo.modality === selectedEstudio.modalityName
    ) || [];
    // Filtrar estudios por modalidad y parte del cuerpo
    const filteredEstudios = (() => {
        if (!estudiosData) return [];

        // Aplicar filtros si están seleccionados
        return estudiosData.filter((estudio: any) => {
            let matches = true;

            if (selectedTipoExamen && estudio.modality !== selectedTipoExamen) {
                matches = false;
            }

            if (selectedParteCuerpo && estudio.bodypart !== selectedParteCuerpo) {
                matches = false;
            }

            return matches;
        });
    })();

    const onTipoExamenChange = (value: string) => {
        setSelectedTipoExamen(value);
        setSelectedEstudio(null);
        setCurrentPage(1);
    }

    const onParteCuerpoChange = (value: string) => {
        setSelectedParteCuerpo(value);
        setSelectedEstudio(null);
        setCurrentPage(1);
    }

    // Paginación
    const totalPages = Math.ceil(filteredEstudios.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentEstudios = filteredEstudios.slice(startIndex, endIndex);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };



    return (
        <div className="space-y-6">
            {/* Header - Paciente Seleccionado */}
            <div className="bg-white rounded-lg border border-purple-100 shadow-sm overflow-hidden">
                <div className="bg-brand-purple p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-purple-100">Paciente seleccionado</p>
                            <h2 className="text-xl font-bold">
                                {selectedPatient?.name} {selectedPatient?.surname}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de contenido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel izquierdo - Estudios disponibles */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filtros */}
                    <div className="bg-white rounded-lg border border-purple-100 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-brand-purple" />
                            ESTUDIOS DISPONIBLES
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Select Modalidad */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Modalidad
                                </label>
                                <Select
                                    onValueChange={onTipoExamenChange}
                                    value={selectedTipoExamen}
                                    disabled={isLoadingTiposExamen}
                                >
                                    <SelectTrigger className="w-full h-10 border border-gray-300 focus:border-brand-purple focus:ring-brand-purple bg-white">
                                        <SelectValue placeholder="Seleccionar modalidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(tiposExamenData ?? []).length > 0 ? (
                                            (tiposExamenData ?? []).map((tipo: any) => (
                                                <SelectItem key={tipo.externalcode} value={tipo.externalcode}>
                                                    {tipo.externalcode}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-data" disabled>No hay datos disponibles</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select Parte del Cuerpo */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Parte del cuerpo
                                </label>
                                <Select
                                    onValueChange={onParteCuerpoChange}
                                    value={selectedParteCuerpo}
                                    disabled={isLoadingPartesCuerpo || !selectedTipoExamen}
                                >
                                    <SelectTrigger className="w-full h-10 border border-gray-300 focus:border-brand-purple focus:ring-brand-purple bg-white">
                                        <SelectValue placeholder="Seleccionar parte del cuerpo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(partesDelCuerpoData ?? []).length > 0 ? (
                                            partesDelCuerpoData?.map((parte: any) => (
                                                <SelectItem key={parte.description} value={parte.description}>
                                                    {parte.description}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-data" disabled>No hay datos disponibles</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tabla de estudios */}
                        {isLoadingEstudios ? (
                            <div className='flex justify-center items-center h-40'>
                                <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Tabla */}
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-brand-purple">
                                            <TableRow className="hover:bg-brand-purple border-b-0">
                                                <TableHead className="text-white font-semibold">CÓDIGO</TableHead>
                                                <TableHead className="text-white font-semibold">DESCRIPCIÓN</TableHead>
                                                <TableHead className="text-white font-semibold">MODALIDAD</TableHead>
                                                <TableHead className="text-white font-semibold">PARTE DEL CUERPO</TableHead>
                                                <TableHead className="text-white font-semibold">GRUPO DE ESTUDIO</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="min-h-[380px]">
                                            {currentEstudios.length === 0 ? (
                                                <>
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-[480px] text-center text-gray-500 align-middle">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <ClipboardList className="w-12 h-12 mb-3 text-gray-300" />
                                                                <p>No hay estudios disponibles</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                </>
                                            ) : (
                                                <>
                                                    {currentEstudios.map((estudio: any) => (
                                                        <TableRow
                                                            key={estudio.guid}
                                                            onClick={() => setSelectedEstudio(estudio)}
                                                            className={`cursor-pointer hover:bg-purple-50 transition-colors ${selectedEstudio?.guid === estudio.guid
                                                                ? 'bg-purple-100 hover:bg-purple-100/80 border-l-4 border-l-brand-purple'
                                                                : ''
                                                                }`}
                                                        >
                                                            <TableCell className="font-medium">{estudio.externalcode}</TableCell>
                                                            <TableCell>{estudio.description}</TableCell>
                                                            <TableCell>
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                                    {estudio.modality}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>{estudio.bodypart}</TableCell>
                                                            <TableCell className="text-sm text-gray-600">{estudio.studygroup}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Filas vacías para mantener altura */}
                                                    {currentEstudios.length < itemsPerPage && Array.from({ length: itemsPerPage - currentEstudios.length }).map((_, index) => (
                                                        <TableRow key={`empty-${index}`} className="h-12">
                                                            <TableCell colSpan={5}>&nbsp;</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Paginación */}
                                {filteredEstudios.length > 0 && (
                                    <div className="flex items-center justify-between px-2">
                                        <div className="text-sm text-gray-600">
                                            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredEstudios.length)} de {filteredEstudios.length} estudios
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={goToPreviousPage}
                                                disabled={currentPage === 1}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm font-medium">
                                                Página {currentPage} de {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={goToNextPage}
                                                disabled={currentPage === totalPages}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel derecho - Estudio seleccionado */}
                <div className="space-y-6 ">
                    {/* Card Estudio Seleccionado */}
                    <div className="bg-white rounded-lg border border-purple-100 shadow-sm overflow-hidden ">
                        <div className="bg-brand-purple p-4 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <Check className="w-5 h-5" />
                                <h3 className="font-semibold uppercase text-sm tracking-wider">Estudio Seleccionado</h3>
                            </div>
                        </div>

                        {selectedEstudio ? (
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Código</p>
                                    <p className="text-brand-purple font-bold">{selectedEstudio.externalcode}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</p>
                                    <p className="text-sm text-gray-800 font-medium">{selectedEstudio.description}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Modalidad</p>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                        {selectedEstudio.modality}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Parte del cuerpo</p>
                                    <p className="text-sm text-gray-700">{selectedEstudio.bodypart}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Grupo</p>
                                    <p className="text-sm text-gray-700">{selectedEstudio.studygroup}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-400">
                                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">Seleccione un estudio de la tabla</p>
                            </div>
                        )}
                    </div>

                    {/* Card Equipos */}
                    <div className="bg-white rounded-lg border border-purple-100 shadow-sm max-h-[400px] overflow-y-auto">
                        <div className="bg-brand-purple p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold uppercase text-sm tracking-wider">Equipos</h3>
                            </div>
                            <Check className="w-5 h-5" />
                        </div>

                        <div className="p-4">
                            {isLoadingEquipos ? (
                                <div className='flex justify-center items-center h-20'>
                                    <span className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500'></span>
                                </div>
                            ) : !selectedEstudio ? (
                                <div className="text-center py-6 text-gray-400">
                                    <p className="text-sm">Seleccione un estudio para ver equipos disponibles</p>
                                </div>
                            ) : filteredEquipos.length === 0 ? (
                                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">No hay equipos disponibles</p>
                                    <p className="text-sm text-red-700">No se encontraron equipos para la modalidad {selectedEstudio.modality}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredEquipos.map((equipo: any, index: number) => {
                                        const isSelected = selectedEquipo?.guid === equipo.guid;
                                        return (
                                            <div
                                                key={equipo.guid || index}
                                                onClick={() => {
                                                    setSelectedEquipo(equipo);
                                                    onEquipoSelected?.(equipo, selectedEstudio);
                                                }}
                                                className={`rounded-lg p-3 border cursor-pointer transition-all duration-200 ${isSelected
                                                    ? 'bg-brand-purple text-white border-brand-purple border-l-4'
                                                    : 'bg-purple-50 border-purple-100 hover:bg-purple-100 hover:border-purple-200'
                                                    }`}
                                            >
                                                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isSelected ? 'text-purple-100' : 'text-gray-600'
                                                    }`}>Equipo</p>
                                                <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-800'
                                                    }`}>{equipo.description || equipo.name}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
