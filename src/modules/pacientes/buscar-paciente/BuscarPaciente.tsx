//layout
import { MainLayout } from "@/layouts/layout";
//react
import { useState } from "react";
//lucide react
import { Search, UserPlus } from "lucide-react";
//components
import { TablaDynamic } from "@/components/TableDynamic";
import { InputSearch } from "@/components/InputSearch";
import { Modal } from "@/components/Modal";
import { CreatePatientForm } from "./components/CreatePatientForm";
import { useDebounce } from "@uidotdev/usehooks";

//hooks and services
import { useBuscarPaciente } from "./hooks/use-buscar-paciente";
import { useCreatePatient } from "./hooks/use-create-patient";
//types and columns
import type { Patient } from "./types/BuscarPaciente";
import { getPatientActions, patientColumns } from "./components/columns";
import type { CreatePatientFormValues } from "./schemas/create-patient.schema";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useNavigate } from "react-router-dom";

export const BuscarPaciente = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const useDebounceSearch = useDebounce(searchTerm, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const createPatientMutation = useCreatePatient();

    // Funciones para las acciones de la tabla
    const handleEditPatient = (patient: Patient) => {
        console.log("Editar paciente:", patient);
        // Aquí abrirías un modal de edición
    };

    const handleDeletePatient = (patient: Patient) => {
        console.log("Eliminar paciente:", patient);
        // Aquí mostrarías un modal de confirmación
    };

    const handleViewHistory = (patient: Patient) => {
        navigate(`/pacientes/${patient.guid}/historial-paciente`);
    };

    // Generar las acciones con las funciones
    const patientActions = getPatientActions(
        handleEditPatient,
        handleDeletePatient,
        handleViewHistory
    );
    const { patientsData, isLoading } = useBuscarPaciente({ page, per_page: 8, search: useDebounceSearch });


    const pagination = patientsData && {
        page: patientsData?.data?.page || 1,
        pageSize: patientsData?.data?.per_page || 5,
        total: patientsData?.data?.total || 0,
    };

    const handleCreatePatient = (data: CreatePatientFormValues) => {
        createPatientMutation.mutate(data, {
            onSuccess: () => {
                setIsModalOpen(false);
            },
        });
    };

    return (
        <MainLayout>
            <div className="bg-white backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Pacientes</h1>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        placeholder="Buscar paciente o historial..."
                    />
                    <PrimaryButton onClick={() => setIsModalOpen(true)}>
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        AGREGAR
                    </PrimaryButton>
                </div>

                {/* Resultados */}
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">RESULTADOS</h2>
                </div>

                {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : (
                    <TablaDynamic<Patient>
                        data={(patientsData?.data?.patients) || []}
                        columns={patientColumns}
                        showIndex
                        onRowDoubleClick={handleViewHistory}
                        actions={patientActions}
                        pagination={pagination}
                        onPaginationChange={(newPage) => {
                            setPage(newPage);
                        }}
                    />
                )}

                {/* Modal de Agregar Paciente */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Agregar Nuevo Paciente"
                    description="Complete los datos del nuevo paciente"
                    size="lg"
                >
                    <CreatePatientForm
                        onSubmit={handleCreatePatient}
                        isLoading={createPatientMutation.isPending}
                    />
                </Modal>
            </div>
        </MainLayout>
    );
};
