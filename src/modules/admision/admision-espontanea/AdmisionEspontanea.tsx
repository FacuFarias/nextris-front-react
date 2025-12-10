//components
import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
//hooks
import { useLocationsInstitutional } from "@/hooks/use-locations"
import { usePacienteDireccion } from "./hooks/use-paciente-direccion"
import { useDebounce } from "@uidotdev/usehooks"
//layout
import { MainLayout } from "@/layouts/layout"
//icons and react
import { Calendar, User, ClipboardList, FileCheck } from "lucide-react"
import { useState, useEffect } from "react"
import { admisionColumns } from "./components/columns"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";
import { TablaDynamic } from "@/components/TableDynamic"
import { Examen } from "./components/Examen"
import { Prestacion } from "./components/Prestacion"



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

    const handleDireccionChange = (direccionId: string) => {
        setSelectedDireccion(direccionId);
        // Hacer la petición con el uuid de la dirección y el término de búsqueda actual
        fetchPacientesDireccion(
            { uuid: direccionId, searchTerm: debouncedSearch },
        );
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
                {
                    activeTab === "paciente" && (
                        <DynamicBreadcrumb />
                    )
                }
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
                                <span className="font-semibold">1. Paciente</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="examen"
                                disabled={!selectedPatient}
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ClipboardList className="w-4 h-4" />
                                <span className="font-semibold">2. Examen</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="prestacion"
                                disabled={!selectedExam}
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <FileCheck className="w-4 h-4" />
                                <span className="font-semibold">3. Prestación</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Content - Paciente */}
                        <TabsContent value="paciente" className="mt-6 space-y-4">
                            {/* Barra de búsqueda */}
                            <div className="flex gap-3 items-center">
                                <div className="w-1/2">
                                    <InputSearch
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        placeholder="Buscar por paciente, medico, médico y equipo..."
                                    />
                                </div>


                                <Select
                                    onValueChange={handleDireccionChange}
                                    value={selectedDireccion}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="w-1/2 border-purple-300 focus:border-purple-500 focus:ring-purple-500 text-sm sm:text-base cursor-pointer  ">
                                        <SelectValue placeholder={isPending ? "Cargando..." : "Seleccione dirección"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locationsData?.data?.map((location: any) => (
                                            <SelectItem key={location.guid} value={location.guid}>
                                                {location.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Tabla de pacientes */}
                            <div className="bg-white rounded-lg border border-purple-100 p-4">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                                    Seleccione un paciente
                                </h2>
                                {isPending ? (
                                    <div className='flex justify-center items-center h-40'>
                                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                                    </div>
                                ) : (
                                    <TablaDynamic<Patient>
                                        data={(pacientesData?.data) || []}
                                        columns={admisionColumns}
                                        showIndex
                                        selectedRow={selectedPatient}
                                        rowIdKey="guid"
                                        onRowClick={(patient) => {
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

                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </MainLayout>
    )
}
