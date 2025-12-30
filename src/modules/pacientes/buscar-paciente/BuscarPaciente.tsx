//layout
import { MainLayout } from "@/layouts/layout";
//react
import { useState } from "react";
//lucide react
import { Search, UserPlus } from "lucide-react";
//components
import { DynamicBreadcrumb, InputSearch, Modal } from "@/components";
import { useDebounce } from "@uidotdev/usehooks";

//hooks and services
import { useBuscarPaciente } from "./hooks/use-buscar-paciente";
import { useCreatePatient, useEditPatient } from "./hooks/use-create-patient";
import TablaDynamic from "@/components/TableDynamic";

//types and columns
import type { Patient } from "./types/BuscarPaciente";
import { getPatientActions, patientColumns } from "./components/columns";
import type { CreatePatientFormValues } from "./schemas/create-patient.schema";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { IsAdmin } from "@/components/IsAdmin";
import { EliminarPaciente } from "./components/EliminarPaciente";

import { CreatePatientForm } from "./components/CreatePatientForm";

export const BuscarPaciente = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const useDebounceSearch = useDebounce(searchTerm, 300);
    const navigate = useNavigate();
    const createPatientMutation = useCreatePatient();
    const editPatientMutation = useEditPatient();
    //crear/editar paciente modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    //eliminar paciente modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Funciones para las acciones de la tabla
    const handleEditPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleAddPatient = () => {
        setSelectedPatient(null);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleDeletePatient = (patient: Patient) => {
        setIsDeleteModalOpen(true);
        setSelectedPatient(patient);
    };

    const handleViewHistory = (patient: Patient) => {
        // Solo navegar si tiene estudios
        if (patient.study_count === 0) return;
        navigate(`/pacientes/historial-paciente`, { state: { patient } });
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
        // Si estamos en modo edición, enviar solo los campos modificados
        if (isEditMode && selectedPatient) {
            const changedFields: Partial<CreatePatientFormValues> = {};
            const initialData = {
                name: selectedPatient.name,
                surname: selectedPatient.surname,
                documentnumber: selectedPatient.nationalcode,
                birthdate: selectedPatient.birthdate,
                gender: selectedPatient.gender as "M" | "F" | "Otro",
                email: selectedPatient.email,
                phone: selectedPatient.phone || "",
                patientdomain_id: selectedPatient.patientid,
            };

            // Comparar cada campo y agregar solo los que cambiaron
            (Object.keys(data) as Array<keyof CreatePatientFormValues>).forEach((key) => {
                if (data[key] !== initialData[key as keyof typeof initialData]) {
                    (changedFields as any)[key] = data[key];
                }
            });

            // Si hay cambios, enviar solo esos campos
            if (Object.keys(changedFields).length > 0) {
                editPatientMutation.mutate({ patientId: selectedPatient.guid, updatedData: changedFields }, {
                    onSuccess: () => {
                        setIsModalOpen(false);
                        setSelectedPatient(null);
                        setIsEditMode(false);
                    },
                });
            } else {
                // No hay cambios, cerrar modal
                setIsModalOpen(false);
                setSelectedPatient(null);
                setIsEditMode(false);
            }
        } else {
            // Modo crear: enviar todos los datos
            createPatientMutation.mutate(data, {
                onSuccess: () => {
                    setIsModalOpen(false);
                },
            });
        }
    };

    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

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
                    <IsAdmin>
                        <PrimaryButton onClick={handleAddPatient}>
                            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            AGREGAR
                        </PrimaryButton>
                    </IsAdmin>

                </div>

                {/* Resultados */}
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700">RESULTADOS</h2>
                </div>

                {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : (
                    <TablaDynamic<Patient>
                        data={(patientsData?.data?.data) || []}
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

                {/* Modal de Agregar/Editar Paciente */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedPatient(null);
                        setIsEditMode(false);
                    }}
                    title={isEditMode ? "Editar Paciente" : "Agregar Nuevo Paciente"}
                    description={isEditMode ? "Modifique los datos del paciente" : "Complete los datos del nuevo paciente"}
                    size="lg"
                >
                    <CreatePatientForm
                        onSubmit={handleCreatePatient}
                        isLoading={createPatientMutation.isPending}
                        initialData={isEditMode && selectedPatient ? {
                            name: selectedPatient.name,
                            surname: selectedPatient.surname,
                            documentnumber: selectedPatient.nationalcode,
                            birthdate: selectedPatient.birthdate,
                            gender: selectedPatient.gender as "M" | "F" | "Otro",
                            email: selectedPatient.email,
                            phone: selectedPatient.phone || "",
                            patientdomain_id: selectedPatient.patientid,
                        } : undefined}
                    />
                </Modal>


                {/* Modal para eliminar Paciente */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Eliminar Paciente"
                    size="lg"
                >
                    <EliminarPaciente
                        patient={selectedPatient}
                        onClose={() => setIsDeleteModalOpen(false)}
                    />
                </Modal>
            </div>
        </MainLayout>
    );
};
