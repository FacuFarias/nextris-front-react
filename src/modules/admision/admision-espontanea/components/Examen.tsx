import { ClipboardList, Check, MousePointerClick } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente"
import { useState } from "react";
import { useEquiposPorLocacion, useEstudiosPorModalidad, useModalidades, usePartesDelCuerpo } from "@/hooks/use-global";
import TablaDynamic from "@/components/TableDynamic"
import type { TableColumn } from "@/types/table"
import fondoImage from "@/assets/fondo1.png"

interface ExamenProps {
    selectedPatient: Patient | null;
    selectedDireccion: string;
    onEquipoSelected?: (equipo: any, estudio: any) => void;
}

export const Examen = ({
    selectedDireccion,
    onEquipoSelected,
}: ExamenProps) => {
    const [selectedTipoExamen, setSelectedTipoExamen] = useState<string>("");
    const [selectedParteCuerpo, setSelectedParteCuerpo] = useState<string>("");
    const [selectedEstudio, setSelectedEstudio] = useState<any>(null);
    const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
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

            if (selectedTipoExamen && selectedTipoExamen !== 'all' && estudio.modality !== selectedTipoExamen) {
                matches = false;
            }

            if (selectedParteCuerpo && selectedParteCuerpo !== 'all' && estudio.bodypart !== selectedParteCuerpo) {
                matches = false;
            }

            return matches;
        });
    })();

    // Definición de columnas para TablaDynamic
    const estudiosColumns: TableColumn[] = [
        {
            key: "externalcode",
            label: "CÓDIGO",
            className: "font-medium w-[90px]",
            headerClassName: "w-[90px]",
            sortable: true,
            filterable: true,
            render: (value: string) => (
                <div className="max-w-[84px] truncate" title={value || ""}>
                    {value || "-"}
                </div>
            ),
        },
        {
            key: "description",
            label: "DESCRIPCIÓN",
            className: "w-[30%]",
            headerClassName: "w-[30%]",
            sortable: true,
            filterable: true,
            render: (value: string) => (
                <div className="max-w-[260px] truncate" title={value || ""}>
                    {value || "-"}
                </div>
            ),
        },
        {
            key: "modality",
            label: "MODALIDAD",
            className: "w-[100px]",
            headerClassName: "w-[100px]",
            sortable: true,
            filterable: true,
            render: (value: string) => (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {value}
                </span>
            ),
        },
        {
            key: "bodypart",
            label: "PARTE DEL CUERPO",
            className: "w-[130px]",
            headerClassName: "w-[130px]",
            sortable: true,
            filterable: true,
            render: (value: string) => (
                <div className="max-w-[120px] truncate" title={value || ""}>
                    {value || "-"}
                </div>
            ),
        },
        {
            key: "studygroup",
            label: "GRUPO DE ESTUDIO",
            className: "text-sm text-gray-600 w-[170px]",
            headerClassName: "w-[170px]",
            sortable: true,
            filterable: true,
            render: (value: string) => (
                <div className="max-w-[160px] truncate" title={value || ""}>
                    {value || "-"}
                </div>
            ),
        },
    ];

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

    const pagination = {
        page: currentPage,
        pageSize: perPage,
        total: filteredEstudios.length,
        serverSide: false as const,
    };



    return (
        <div className="space-y-6">


            {/* Grid de contenido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel izquierdo - Estudios disponibles */}
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    {/* Filtros */}
                    <div className="bg-white rounded-lg border border-purple-100 shadow-sm p-4">

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
                        <TablaDynamic
                            data={filteredEstudios}
                            columns={estudiosColumns}
                            loading={isLoadingEstudios}
                            emptyMessage={
                                <div className="flex flex-col items-center justify-center">
                                    <ClipboardList className="w-12 h-12 mb-3 text-gray-300" />
                                    <p>No hay estudios disponibles</p>
                                </div>
                            }
                            onRowClick={(row) => {
                                setSelectedEstudio(row);
                            }}
                            selectedRow={selectedEstudio}
                            rowIdKey="guid"
                            pagination={pagination}
                            onPaginationChange={(newPage) => {
                                setCurrentPage(newPage);
                            }}
                            perPageValue={perPage}
                            onPerPageChange={(value) => {
                                setPerPage(value);
                                setCurrentPage(1);
                            }}
                            perPageOptions={[10, 20, 50]}
                            maxHeight="56vh"
                            tableBackgroundImage={fondoImage}
                            tableClassName="table-fixed w-full"
                            preserveTableHeight
                        />
                    </div>
                </div>

                {/* Panel derecho - Estudio seleccionado */}
                <div className="space-y-6 min-w-0">
                    {/* Card Estudio Seleccionado */}
                    <div className="bg-white rounded-lg border border-purple-100 shadow-sm overflow-hidden">
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
                                                className={`group relative rounded-lg p-3 border cursor-pointer transition-all duration-200 ${isSelected
                                                    ? 'bg-brand-purple text-white border-brand-purple border-l-4'
                                                    : 'bg-purple-50 border-purple-100 hover:bg-purple-100 hover:border-purple-200'
                                                    }`}
                                            >
                                                {!isSelected && (
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 text-brand-purple border border-brand-purple/20 px-2 py-1 text-[11px] font-semibold shadow-sm">
                                                            <MousePointerClick className="w-3 h-3" />
                                                            Seleccionar
                                                        </span>
                                                    </div>
                                                )}
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