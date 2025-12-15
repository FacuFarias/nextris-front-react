//components
import { InputSearch } from "@/components/InputSearch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablaDynamic } from "@/components/TableDynamic"
import { PrimaryButton } from "@/components/PrimaryButton"
import { Modal } from "@/components/Modal"
import { DireccionSelector } from "@/components/DireccionSelector"
//hooks
import { useDebounce } from "@uidotdev/usehooks"
//layout
import { MainLayout } from "@/layouts/layout"
//icons and react
import { Calendar, User, ClipboardList, FileCheck, UserPlus } from "lucide-react"
import { useState } from "react"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";
import { usePacienteDireccion } from "@/modules/admision/admision-espontanea/hooks/use-paciente-direccion"
import { admisionColumns } from "@/modules/admision/admision-espontanea/components/columns"
import { Agenda } from "./components/Agenda"
import { Examen } from "./components/Examen"

export const NuevaCita = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDireccion, setSelectedDireccion] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("paciente");
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedEstudios, setSelectedEstudios] = useState<any[]>([]);
    const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
    const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
    const [allEvents, setAllEvents] = useState<{ [equipoGuid: string]: any[] }>({});
    const debouncedSearch = useDebounce(searchTerm, 500);
    const { mutate: fetchPacientesDireccion, data: pacientesData, isPending } = usePacienteDireccion();
    //modal agregar paciente
    const [isModalOpen, setIsModalOpen] = useState(false);
    //hook para crear paciente

    const handleDireccionChange = (direccionId: string) => {
        setSelectedDireccion(direccionId);

        fetchPacientesDireccion(
            { uuid: direccionId, searchTerm: debouncedSearch },
        );
    };

    const handleAddPatient = () => {
        setIsModalOpen(true);

    };


    const handleResetForm = () => {
        setSelectedPatient(null);
        setSelectedEstudios([]);
        setSelectedEquipo(null);
        setSearchTerm("");
        setSelectedDireccion("");
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
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Header con Tabs integrados */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple">Crear cita</h1>
                    </div>

                    {/* Tabs modernos */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 h-auto bg-purple-50/50 p-1 rounded-xl gap-2">
                            <TabsTrigger
                                value="paciente"
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <User className="w-4 h-4" />
                                <span className="font-semibold">1. Paciente : {selectedPatient?.name} {selectedPatient?.surname}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="examen"
                                disabled={!selectedPatient}
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                            >
                                <ClipboardList className="w-4 h-4" />
                                <span className="font-semibold">2. Examen</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="agenda"
                                disabled={selectedEstudios.length === 0}
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                            >
                                <ClipboardList className="w-4 h-4" />
                                <span className="font-semibold">3. Agenda {selectedEstudios.length > 0 && `(${selectedEstudios.length})`}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="prestacion"
                                disabled={selectedEstudios.length === 0}
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                            >
                                <FileCheck className="w-4 h-4" />
                                <span className="font-semibold">4. Prestación</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Content - Paciente */}
                        <TabsContent value="paciente" className="mt-6 space-y-4">
                            {/* Selector de Dirección */}
                            <DireccionSelector
                                selectedDireccion={selectedDireccion}
                                onDireccionChange={handleDireccionChange}
                                isPending={isPending}
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
                            <div className="bg-white rounded-lg border border-purple-100 p-4">
                                <div className="w-full flex justify-between">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                                        Seleccione un paciente
                                    </h2>

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
                                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
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
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                {Object.values(allEvents)
                                    .flat()
                                    .filter(ev => !ev.extendedProps?.blocked)
                                    .map((ev, idx) => (
                                        <div key={ev.id || idx} className="bg-white border border-purple-200 rounded-lg shadow p-4 flex flex-col gap-2">
                                            <div className="font-bold text-brand-purple text-lg">
                                                {ev.extendedProps?.study?.description}
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                <span className="font-semibold">Equipo:</span> {ev.extendedProps?.equipo?.description || ev.extendedProps?.equipo?.guid}
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                <span className="font-semibold">Código:</span> {ev.extendedProps?.study?.externalcode}
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                <span className="font-semibold">Inicio:</span> {new Date(ev.start).toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                <span className="font-semibold">Fin:</span> {new Date(ev.end).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                            </div>
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
