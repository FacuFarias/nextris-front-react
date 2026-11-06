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
import { useQuery } from "@tanstack/react-query"
//layout
import { MainLayout } from "@/layouts/layout"
import { api } from "@/lib/api"
import { useAppConfig } from "@/context/AppConfigContext"
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
    const [pageSize, setPageSize] = useState(20);
    const tabsListRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const [indicator, setIndicator] = useState({ left: 0, width: 0 })
    //modal agregar paciente
    const [isModalOpen, setIsModalOpen] = useState(false);
    //hook para crear paciente
    const pacienteRapido = usePacienteRapido();
    const { config } = useAppConfig();

    const { data: selectedFacilityPlan } = useQuery({
        queryKey: ["facility-plan", config?.id?.toString() || "1", "admision-espontanea"],
        queryFn: async () => {
            const response = await api.get(`/config/facilities/${config?.id?.toString() || "1"}/plan`);
            return response.data?.data?.plan || null;
        },
        enabled: Boolean(config?.id?.toString() || "1"),
        staleTime: 60 * 1000,
    });

    const isFreePlan = String(selectedFacilityPlan?.plan_code || "").toLowerCase() === "free";

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
        if (!selectedDireccion) {
            return;
        }

        pacienteRapido.mutate({
            nombre: data.nombre,
            apellido: data.apellido,
            sexo: data.sexo,
            dni: data.dni,
            fecha_nac: data.fecha_nac,
            location_id: selectedDireccion,
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                fetchPacientesDireccion({
                    uuid: selectedDireccion,
                    searchTerm: debouncedSearch,
                });
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

    useEffect(() => {
        if (isFreePlan && activeTab === "prestacion") {
            setActiveTab("examen");
        }
    }, [isFreePlan, activeTab]);

    useEffect(() => {
        setSelectedDireccion("");
        setSelectedPatient(null);
        setSelectedEstudio(null);
        setSelectedExam(null);
        setActiveTab("paciente");
    }, [config?.id?.toString() || "1"]);

    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Header con Tabs integrados */}
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex items-center gap-3 mb-4 admission-soft-enter">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Admisión Espontánea</h1>
                    </div>

                    {/* Tabs modernos */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
                        <div className="relative shrink-0">
                            <TabsList
                                ref={tabsListRef}
                                className="w-full justify-start gap-0 overflow-x-auto overscroll-x-contain rounded-none border-b border-gray-200 bg-transparent p-0 dark:border-gray-700 [&>[data-slot=tabs-trigger]]:flex-none"
                            >
                                <TabsTrigger
                                    value="paciente"
                                    ref={(el) => {
                                        if (el) tabRefs.current.set("paciente", el)
                                    }}
                                        className="flex shrink-0 items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-gray-500 shadow-none hover:text-gray-700 data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-brand-purple dark:text-gray-400 dark:hover:text-gray-200 dark:data-[state=active]:text-purple-400"
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
                                {!isFreePlan ? (
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
                                ) : null}
                            </TabsList>
                            <div
                                className="absolute bottom-0 h-0.5 bg-brand-purple transition-all duration-300 ease-in-out"
                                style={{ left: indicator.left, width: indicator.width }}
                            />
                        </div>

                        {/* Tab Content - Paciente */}
                        <TabsContent value="paciente" className="mt-6 space-y-4 admission-soft-enter admission-soft-enter-delay-1 flex flex-col flex-1 min-h-0 overflow-hidden">
                            {/* Selector de Dirección */}
                            <div className="admission-soft-enter admission-soft-enter-delay-1">
                                <DireccionSelector
                                    selectedDireccion={selectedDireccion}
                                    onDireccionChange={handleDireccionChange}
                                    facilityId={config?.id?.toString() || "1"}
                                    isPending={isPending}
                                    isRow={true}
                                />
                            </div>

                            {/* Barra superior: búsqueda + acciones */}
                            {selectedDireccion && (
                                <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center gap-3 admission-soft-enter admission-soft-enter-delay-2">
                                    <InputSearch
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        placeholder="Buscar por paciente, medico, médico y equipo..."
                                    />
                                    <div className="flex justify-end gap-2 lg:shrink-0">
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
                            )}

                            {/* Tabla de pacientes */}
                            <div className="admission-soft-enter admission-soft-enter-delay-3 flex-1 min-h-0 overflow-hidden">
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
                                        stickyPagination
                                        compactSpacing
                                        mobileMode="cards"
                                        preserveTableHeight
                                        maxHeight="calc(100% - 8%)"
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
                                isFreePlan={isFreePlan}
                                onOrderCreated={handleResetForm}
                                onEquipoSelected={(equipo, estudio) => {
                                    setSelectedExam(equipo);
                                    setSelectedEstudio(estudio);
                                    if (!isFreePlan) {
                                        setActiveTab("prestacion");
                                    }
                                }}
                            />
                        </TabsContent>

                        {/* Tab Content - Prestación */}
                        {!isFreePlan ? (
                            <TabsContent value="prestacion" className="mt-6">
                                <Prestacion
                                    selectedPatient={selectedPatient}
                                    selectedEstudio={selectedEstudio}
                                    selectedEquipo={selectedExam}
                                    selectedDireccion={selectedDireccion}
                                    onResetForm={handleResetForm}
                                />
                            </TabsContent>
                        ) : null}
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
