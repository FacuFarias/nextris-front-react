import { ClipboardList, Check, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente"
import { useState } from "react";
import { useEstudiosPorModalidad, useModalidades, usePartesDelCuerpo } from "@/hooks/use-global";


interface ExamenProps {
    selectedPatient: Patient | null;
    selectedDireccion: string;
    selectedEstudios: any[];
    setSelectedEstudios: React.Dispatch<React.SetStateAction<any[]>>;
    onEquipoSelected?: (equipo: any, estudio: any) => void;
    onContinue?: (estudios: any[]) => void;
}

export const Examen = ({
    selectedEstudios,
    setSelectedEstudios,
    onContinue
}: ExamenProps) => {
    const [selectedTipoExamen, setSelectedTipoExamen] = useState<string>("");
    const [selectedParteCuerpo, setSelectedParteCuerpo] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { data: tiposExamenData, isLoading: isLoadingTiposExamen } = useModalidades();
    const { data: partesDelCuerpoData, isLoading: isLoadingPartesCuerpo } = usePartesDelCuerpo();
    const { data: estudiosData, isLoading: isLoadingEstudios } = useEstudiosPorModalidad();

    // Filtrar estudios por modalidad y parte del cuerpo
    const filteredEstudios = (() => {
        if (!estudiosData) return [];
        // Aplicar filtros si están seleccionados
        return estudiosData.filter((estudio: any) => {
            let matches = true;

            if (selectedTipoExamen && selectedTipoExamen !== 'all' && estudio.modality !== selectedTipoExamen) {
                matches = false;
            }

            if (selectedParteCuerpo && selectedParteCuerpo !== 'all' && estudio.bodypart !== selectedParteCuerpo) {
                matches = false;
            }

            return matches;
        });
    })();

    const onTipoExamenChange = (value: string) => {
        setSelectedTipoExamen(value);
        setCurrentPage(1);
    }

    const onParteCuerpoChange = (value: string) => {
        setSelectedParteCuerpo(value);
        setCurrentPage(1);
    }

    const toggleEstudioSelection = (estudio: any) => {
        setSelectedEstudios((prev: any) => {
            const isAlreadySelected = prev.some((e: any) => e.guid === estudio.guid);
            if (isAlreadySelected) {
                return prev.filter((e: any) => e.guid !== estudio.guid);
            } else {
                return [...prev, estudio];
            }
        });
    }

    const removeEstudio = (estudioGuid: string) => {
        setSelectedEstudios((prev: any[]) => prev.filter((e: any) => e.guid !== estudioGuid));
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


            {/* Grid de contenido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel izquierdo - Estudios disponibles */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filtros */}
                    <div className="bg-card dark:bg-[#2a2e32] rounded-lg border border-purple-100 dark:border-gray-700 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 dark:text-gray-200">
                            <ClipboardList className="w-5 h-5 text-brand-purple dark:text-purple-400" />
                            ESTUDIOS DISPONIBLES
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Select Modalidad */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Modalidad
                                </label>
                                <Select
                                    onValueChange={onTipoExamenChange}
                                    value={selectedTipoExamen}
                                    disabled={isLoadingTiposExamen}
                                >
                                    <SelectTrigger className="w-full h-10 border border-gray-300 dark:border-gray-600 focus:border-brand-purple focus:ring-brand-purple bg-white dark:bg-gray-700 dark:text-gray-200">
                                        <SelectValue placeholder="Seleccionar modalidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
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
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Parte del cuerpo
                                </label>
                                <Select
                                    onValueChange={onParteCuerpoChange}
                                    value={selectedParteCuerpo}
                                    disabled={isLoadingPartesCuerpo || !selectedTipoExamen}
                                >
                                    <SelectTrigger className="w-full h-10 border border-gray-300 dark:border-gray-600 focus:border-brand-purple focus:ring-brand-purple bg-white dark:bg-gray-700 dark:text-gray-200">
                                        <SelectValue placeholder="Seleccionar parte del cuerpo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
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
                                <div className="rounded-md border  overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-brand-purple dark:bg-purple-900">
                                            <TableRow className="hover:bg-brand-purple dark:hover:bg-purple-900 border-b-0">
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
                                                        <TableCell colSpan={5} className="h-[480px] text-center text-gray-500 dark:text-gray-400 align-middle">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <ClipboardList className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                                                                <p>No hay estudios disponibles</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                </>
                                            ) : (
                                                <>
                                                    {currentEstudios.map((estudio: any) => {
                                                        const isSelected = selectedEstudios.some(e => e.guid === estudio.guid);
                                                        return (
                                                            <TableRow
                                                                key={estudio.guid}
                                                                onClick={() => toggleEstudioSelection(estudio)}
                                                                className={`cursor-pointer transition-colors ${isSelected
                                                                    ? 'bg-purple-100 hover:bg-purple-100/80 dark:bg-purple-900/50 dark:hover:bg-purple-900/70 border-l-4 border-l-brand-purple dark:border-l-purple-400'
                                                                    : 'hover:bg-purple-50 dark:hover:bg-gray-700/50'
                                                                    }`}
                                                            >
                                                                <TableCell className="font-medium dark:text-gray-200">{estudio.externalcode}</TableCell>
                                                                <TableCell className="dark:text-gray-200">{estudio.description}</TableCell>
                                                                <TableCell>
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                        {estudio.modality}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="dark:text-gray-200">{estudio.bodypart}</TableCell>
                                                                <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={estudio.studygroup}>{estudio.studygroup}</TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
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
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
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
                    <div className="bg-card  rounded-lg border border-purple-100 dark:border-gray-700 shadow-sm overflow-hidden ">
                        <div className="bg-brand-purple dark:bg-purple-900 p-4 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5" />
                                    <h3 className="font-semibold uppercase text-sm tracking-wider">Estudios Seleccionados</h3>
                                </div>
                                {selectedEstudios.length > 0 && (
                                    <span className="bg-white dark:bg-gray-200 text-brand-purple dark:text-purple-900 px-2 py-1 rounded-full text-xs font-bold">
                                        {selectedEstudios.length}
                                    </span>
                                )}
                            </div>
                        </div>

                        {selectedEstudios.length > 0 ? (
                            <div className="p-4 space-y-3">
                                {/* Lista de estudios seleccionados */}
                                <div className="max-h-[400px] overflow-y-auto space-y-3">
                                    {selectedEstudios.map((estudio) => (
                                        <div key={estudio.guid} className="border border-purple-200 dark:border-gray-600 rounded-lg p-3 bg-purple-50/50 dark:bg-[#2a2e32] relative">
                                            <button
                                                onClick={() => removeEstudio(estudio.guid)}
                                                className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <div className="pr-6">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Código</p>
                                                <p className="text-brand-purple font-bold mb-2 dark:text-purple-400">{estudio.externalcode}</p>

                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Descripción</p>
                                                <p className="text-sm text-gray-800 font-medium mb-2 dark:text-gray-200">{estudio.description}</p>

                                                <div className="flex gap-2 flex-wrap">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {estudio.modality}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                                                        {estudio.bodypart}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Botón para continuar */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        onClick={() => onContinue?.(selectedEstudios)}
                                        className="w-full bg-brand-purple hover:bg-brand-purple/90 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        CONTINUAR CON {selectedEstudios.length} ESTUDIO{selectedEstudios.length > 1 ? 'S' : ''}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-400 dark:text-gray-500">
                                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm">Seleccione uno o más estudios de la tabla</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
