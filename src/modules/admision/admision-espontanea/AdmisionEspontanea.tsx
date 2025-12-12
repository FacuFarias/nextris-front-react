//components
import { InputSearch } from "@/components/InputSearch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TablaDynamic } from "@/components/TableDynamic"
import { Examen } from "./components/Examen"
import { Prestacion } from "./components/Prestacion"
import { PrimaryButton } from "@/components/PrimaryButton"
import { Modal } from "@/components/Modal"
import { admisionColumns } from "./components/columns"
import { AgregarPacienteRapido } from "./components/AgregarPacienteRapido"
//hooks
import { useLocationsInstitutional } from "@/hooks/use-locations"
import { usePacienteDireccion } from "./hooks/use-paciente-direccion"
import { useDebounce } from "@uidotdev/usehooks"
//layout
import { MainLayout } from "@/layouts/layout"
//icons and react
import { Calendar, User, ClipboardList, FileCheck, UserPlus, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
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

    const { data: locationsData } = useLocationsInstitutional();
    //modal agregar paciente
    const [isModalOpen, setIsModalOpen] = useState(false);
    //hook para crear paciente
    const pacienteRapido = usePacienteRapido();
    const handleDireccionChange = (direccionId: string) => {
        setSelectedDireccion(direccionId);
        // Hacer la petición con el uuid de la dirección y el término de búsqueda actual
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

    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Header con Tabs integrados */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple">Admisión Espontánea</h1>
                    </div>

                    {/* Tabs modernos */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-auto bg-purple-50/50 p-1 rounded-xl gap-2">
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
                                value="prestacion"
                                disabled={!selectedExam}
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                            >
                                <FileCheck className="w-4 h-4" />
                                <span className="font-semibold">3. Prestación</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Content - Paciente */}
                        <TabsContent value="paciente" className="mt-6 space-y-4">
                            {/* Selector de Dirección - Prominente */}
                            <div className="bg-brand-purple rounded-lg p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg"> Seleccione una Dirección</h3>
                                    </div>
                                </div>
                                <Select
                                    onValueChange={handleDireccionChange}
                                    value={selectedDireccion}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="w-full bg-white border-2 border-white hover:border-purple-200 focus:border-white focus:ring-2 focus:ring-white/50 text-base font-medium py-6 cursor-pointer shadow-md">
                                        <SelectValue placeholder={isPending ? "Cargando direcciones..." : "Seleccione una dirección para comenzar"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locationsData?.data?.map((location: any) => (
                                            <SelectItem key={location.guid} value={location.guid} className="text-base py-3">
                                                {location.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

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
