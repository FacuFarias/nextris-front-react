//components
import { InputSearch } from "@/components/InputSearch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablaDynamic } from "@/components/TableDynamic"
import { PrimaryButton } from "@/components/PrimaryButton"
import { DireccionSelector } from "@/components/DireccionSelector"
//hooks
import { useDebounce } from "@uidotdev/usehooks"
//layout
import { MainLayout } from "@/layouts/layout"
//icons and react
import { Calendar, User, ClipboardList, FileCheck, UserPlus, Loader2, CircleCheck } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";
import { usePacienteDireccion } from "@/modules/admision/admision-espontanea/hooks/use-paciente-direccion"
import { admisionColumns } from "@/modules/admision/admision-espontanea/components/columns"
import { Agenda } from "./components/Agenda"
import { Examen } from "./components/Examen"
import { Prestacion } from "./components/Prestacion"

export const NuevaCita = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDireccion, setSelectedDireccion] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("paciente");
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedEstudios, setSelectedEstudios] = useState<any[]>([]);
    const [, setSelectedAgenda] = useState<any>(null);
    const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
    const [allEvents, setAllEvents] = useState<{ [equipoGuid: string]: any[] }>({});
    const debouncedSearch = useDebounce(searchTerm, 500);
    const { mutate: fetchPacientesDireccion, data: pacientesData, isPending } = usePacienteDireccion();
    //modal agregar paciente
    const [, setIsModalOpen] = useState(false);
    //hook para crear paciente
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const tabsListRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })

    // Estado de completado de cada paso
    const hasEvents = Object.values(allEvents).flat().some(ev => !ev.extendedProps?.blocked);
    const completedSteps = {
        paciente: !!selectedPatient,
        examen: selectedEstudios.length > 0,
        agenda: hasEvents,
    };

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

    useEffect(() => {
        updateIndicator()
    }, [updateIndicator])

    useEffect(() => {
        window.addEventListener("resize", updateIndicator)
        return () => window.removeEventListener("resize", updateIndicator)
    }, [updateIndicator])

    const handleDireccionChange = (direccionId: string) => {
        setSelectedDireccion(direccionId);

        fetchPacientesDireccion(
            { uuid: direccionId, searchTerm: debouncedSearch },
        );
    };

    const handleAddPatient = () => {
        setIsModalOpen(true);

    };
    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };


    const handleResetForm = () => {
        setSelectedPatient(null);
        setSelectedEstudios([]);
        setSelectedEquipo(null);
        setSearchTerm("");
        setSelectedDireccion("");
        setAllEvents({});

        setTimeout(() => {
            setActiveTab("paciente");
        }, 300);
    };
    // Ejecutar búsqueda cuando cambie el término de búsqueda debounced
    /*  useEffect(() => {
         if (selectedDireccion && debouncedSearch !== undefined) {
             fetchPacientesDireccion(
                 { uuid: selectedDireccion, searchTerm: debouncedSearch },
             );
         }
     }, [debouncedSearch, selectedDireccion]); */
    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10overflow-y-auto">
                {/* Header con Tabs integrados */}
                <div className="">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-brand-purple p-2 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple">Crear cita</h1>
                    </div>
                    {/* Tabs modernos */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="relative shrink-0">
                            <TabsList
                                ref={tabsListRef}
                                className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0 justify-start gap-0 w-full"
                            >
                                <TabsTrigger
                                    value="paciente"
                                    ref={(el) => {
                                        if (el) tabRefs.current.set("paciente", el)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 bg-transparent shadow-none"
                                >
                                    <User className="w-4 h-4" />
                                    <span>1. Paciente {selectedPatient ? `: ${selectedPatient.name} ${selectedPatient.surname}` : ''}</span>
                                    {completedSteps.paciente && <CircleCheck className="w-4 h-4 text-green-500" />}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="examen"
                                    disabled={!selectedPatient}
                                    ref={(el) => {
                                        if (el) tabRefs.current.set("examen", el)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 bg-transparent shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    <span>2. Examen</span>
                                    {completedSteps.examen && <CircleCheck className="w-4 h-4 text-green-500" />}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="agenda"
                                    disabled={selectedEstudios.length === 0}
                                    ref={(el) => {
                                        if (el) tabRefs.current.set("agenda", el)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 bg-transparent shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    <span>3. Agenda {selectedEstudios.length > 0 && `(${selectedEstudios.length})`}</span>
                                    {completedSteps.agenda && <CircleCheck className="w-4 h-4 text-green-500" />}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="prestacion"
                                    disabled={selectedEstudios.length === 0}
                                    ref={(el) => {
                                        if (el) tabRefs.current.set("prestacion", el)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:text-brand-purple data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 bg-transparent shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <FileCheck className="w-4 h-4" />
                                    <span>4. Prestación</span>
                                </TabsTrigger>
                            </TabsList>
                            <div
                                className="absolute bottom-0 h-0.5 bg-brand-purple transition-all duration-300 ease-in-out"
                                style={{ left: indicator.left, width: indicator.width }}
                            />
                        </div>

                        {/* Tab Content - Paciente */}
                        <TabsContent value="paciente" className="mt-6 space-y-2">
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
                            <div className="bg-white rounded-lg border border-purple-100 p-2">
                                <div className="w-full flex justify-end">
                                    <div className="flex gap-2">
                                        {selectedPatient && (
                                            <PrimaryButton onClick={() => setActiveTab("examen")}>
                                                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                                SELECCIONAR
                                            </PrimaryButton>
                                        )}
                                        <PrimaryButton onClick={handleAddPatient}>
                                            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 " />
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
                                selectedEstudios={selectedEstudios}
                                setSelectedEstudios={setSelectedEstudios}
                                onContinue={(estudios) => {
                                    setSelectedEstudios(estudios);
                                    setActiveTab("agenda");
                                }}
                            />
                        </TabsContent>
                        <TabsContent value="agenda" className="mt-6">
                            {<Agenda
                                selectedPatient={selectedPatient}
                                selectedEstudios={selectedEstudios}
                                selectedEquipo={selectedEquipo}
                                onAgendaSelected={(agenda) => {
                                    setSelectedAgenda(agenda);
                                    /* setActiveTab("prestacion"); */
                                }}
                                selectedDireccion={selectedDireccion}
                                setAllEvents={setAllEvents}
                                allEvents={allEvents}
                                onGoNext={() => setActiveTab('prestacion')}
                            />}
                        </TabsContent>

                        {/* Tab Content - Prestación */}
                        <TabsContent value="prestacion" className="mt-6">
                            <Prestacion
                                selectedPatient={selectedPatient}
                                selectedDireccion={selectedDireccion}
                                allEvents={allEvents}
                                onSuccess={handleResetForm}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Modal de Agregar/Editar Paciente */}
                {/* <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    title="Agregar paciente rapido"
                    description={"Complete los datos del nuevo paciente"}
                    size="lg"
                >
                    <AgregarPacienteRapido onSubmit={handleCreatePatient} isLoading={false} />
                </Modal> */}
            </div>
        </MainLayout>
    )
}
