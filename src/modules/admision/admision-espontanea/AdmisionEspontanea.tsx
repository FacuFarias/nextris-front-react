//components
import { InputSearch } from "@/components/InputSearch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablaDynamic } from "@/components/TableDynamic"
import { Examen } from "./components/Examen"
import { Prestacion } from "./components/Prestacion"
import { PrimaryButton } from "@/components/PrimaryButton"
import { Modal } from "@/components/Modal"
import { DireccionSelector } from "@/components/DireccionSelector"
import { admisionColumns } from "./components/columns"
import { AgregarPacienteRapido } from "./components/AgregarPacienteRapido"
//hooks
import { usePacienteDireccion } from "./hooks/use-paciente-direccion"
import { useDebounce } from "@uidotdev/usehooks"
//layout
import { MainLayout } from "@/layouts/layout"
//icons and react
import { Calendar, User, ClipboardList, FileCheck, UserPlus, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";

import type { CreatePatientFormFast } from "./schemas/create-patient-fast.schema"
import { usePacienteRapido } from "./hooks/use-paciente-rapido"



export const AdmisionEspontanea = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDireccion, setSelectedDireccion] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("paciente");
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedEstudio, setSelectedEstudio] = useState<any>(null);
    const [selectedExam, setSelectedExam] = useState<any>(null);

    const debouncedSearch = useDebounce(searchTerm, 500);
    const { mutate: fetchPacientesDireccion, data: pacientesData, isPending } = usePacienteDireccion();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const tabsListRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })
    //modal agregar paciente
    const [isModalOpen, setIsModalOpen] = useState(false);
    //hook para crear paciente
    const pacienteRapido = usePacienteRapido();

    const updateIndicator = useCallback(() => {
        const activeEl = tabRefs.current.get(activeTab)
        const container = tabsListRef.current
        if (activeEl && container) {
            const containerRect = container.getBoundingClientRect()
            const tabRect = activeEl.getBoundingClientRect()
            setIndicator({
                left: tabRect.left - containerRect.left,
                width: tabRect.width,
            })
        }
    }, [activeTab])


    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };
    const handleDireccionChange = (direccionId: string) => {
        setSelectedDireccion(direccionId);

        fetchPacientesDireccion(
            { uuid: direccionId, searchTerm: debouncedSearch },
        );
    };
    const handleAddPatient = () => {
        setIsModalOpen(true);

    };

    const handleCreatePatient = (data: CreatePatientFormFast) => {
        pacienteRapido.mutate({
            nombre: data.nombre,
            apellido: data.apellido,
            sexo: data.sexo,
            dni: data.dni,
            fecha_nac: data.fecha_nac,
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
            }
        })
    };

    const handleResetForm = () => {
        setSelectedPatient(null);
        setSelectedEstudio(null);
        setSelectedExam(null);
        setSearchTerm("");
        setSelectedDireccion("");
        setTimeout(() => {
            setActiveTab("paciente");
        }, 300);
    };
    // Ejecutar búsqueda cuando cambie el término de búsqueda debounced
    useEffect(() => {
        if (selectedDireccion && debouncedSearch !== undefined) {
            fetchPacientesDireccion(
                { uuid: selectedDireccion, searchTerm: debouncedSearch },
            );
        }
    }, [debouncedSearch, selectedDireccion]);

    useEffect(() => {
        updateIndicator()
    }, [updateIndicator])

    useEffect(() => {
        window.addEventListener("resize", updateIndicator)
        return () => window.removeEventListener("resize", updateIndicator)
    }, [updateIndicator])

    return (
        <MainLayout>
            <div className="bg-card backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Header con Tabs integrados */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Admisión Espontánea</h1>
                    </div>

                    {/* Tabs modernos */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="relative shrink-0">
                            <TabsList
                                ref={tabsListRef}
                                className="bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-0 justify-start gap-0 w-full"
                            >
                                <TabsTrigger
                                    value="paciente"
                                    ref={(el) => {
                                        if (el) tabRefs.current.set("paciente", el)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent shadow-none"
                                >
                                    <User className="w-4 h-4" />
                                    <span>1. Paciente : {selectedPatient?.name} {selectedPatient?.surname}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="examen"
                                    disabled={!selectedPatient}
                                    ref={(el) => {
                                        if (el) tabRefs.current.set("examen", el)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    <span>2. Examen</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="prestacion"
                                    disabled={!selectedExam}
                                    ref={(el) => {
                                        if (el) tabRefs.current.set("prestacion", el)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple dark:data-[state=active]:text-purple-400 data-[state=active]:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <FileCheck className="w-4 h-4" />
                                    <span>3. Prestación</span>
                                </TabsTrigger>
                            </TabsList>
                            <div
                                className="absolute bottom-0 h-0.5 bg-brand-purple transition-all duration-300 ease-in-out"
                                style={{ left: indicator.left, width: indicator.width }}
                            />
                        </div>

                        {/* Tab Content - Paciente */}
                        <TabsContent value="paciente" className="mt-6 space-y-4">
                            {/* Selector de Dirección */}
                            <DireccionSelector
                                selectedDireccion={selectedDireccion}
                                onDireccionChange={handleDireccionChange}
                                isPending={isPending}
                                isRow={true}
                            />

                            {/* Barra de búsqueda */}
                            {selectedDireccion && (
                                <div className="w-full">
                                    <InputSearch
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        placeholder="Buscar por paciente, medico, médico y equipo..."
                                    />
                                </div>
                            )}

                            {/* Tabla de pacientes */}
                            <div className="bg-white dark:bg-[#2a2e32] rounded-lg border border-purple-100 dark:border-gray-700 p-4">
                                <div className="w-full flex justify-end">
                                    <div className="flex gap-2">
                                        {selectedPatient && (
                                            <PrimaryButton onClick={() => setActiveTab("examen")}>
                                                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                                SELECCIONAR
                                            </PrimaryButton>
                                        )}
                                        <PrimaryButton onClick={handleAddPatient}>
                                            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                            AGREGAR
                                        </PrimaryButton>
                                    </div>
                                </div>

                                {isPending ? (
                                    <div className='flex justify-center items-center h-40'>
                                        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
                                    </div>
                                ) : (
                                    <TablaDynamic<Patient>
                                        data={selectedDireccion ? (pacientesData?.data || []) : []}
                                        columns={admisionColumns}
                                        showIndex
                                        selectedRow={selectedPatient}
                                        rowIdKey="guid"
                                        onRowClick={(patient) => {
                                            setSelectedPatient(patient);
                                        }}
                                        onRowDoubleClick={(patient) => {
                                            setSelectedPatient(patient);
                                            setActiveTab("examen");
                                        }}
                                        pagination={{
                                            page,
                                            pageSize,
                                            serverSide: false,
                                            total: Array.isArray(pacientesData?.data) ? pacientesData.data.length : 0,
                                        }}
                                        onPaginationChange={handlePaginationChange}
                                        emptyMessage="Seleccione una dirección para ver los pacientes asociados."
                                    />
                                )}
                            </div>
                        </TabsContent>

                        {/* Tab Content - Examen */}
                        <TabsContent value="examen" className="mt-6">
                            <Examen
                                selectedPatient={selectedPatient}
                                selectedDireccion={selectedDireccion}
                                onEquipoSelected={(equipo, estudio) => {
                                    setSelectedExam(equipo);
                                    setSelectedEstudio(estudio);
                                    setActiveTab("prestacion");
                                }}
                            />
                        </TabsContent>

                        {/* Tab Content - Prestación */}
                        <TabsContent value="prestacion" className="mt-6">
                            <Prestacion
                                selectedPatient={selectedPatient}
                                selectedEstudio={selectedEstudio}
                                selectedEquipo={selectedExam}
                                selectedDireccion={selectedDireccion}
                                onResetForm={handleResetForm}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Modal de Agregar/Editar Paciente */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    title="Agregar paciente rapido"
                    description={"Complete los datos del nuevo paciente"}
                    size="lg"
                >
                    <AgregarPacienteRapido onSubmit={handleCreatePatient} isLoading={false} />
                </Modal>
            </div>
        </MainLayout>
    )
}
