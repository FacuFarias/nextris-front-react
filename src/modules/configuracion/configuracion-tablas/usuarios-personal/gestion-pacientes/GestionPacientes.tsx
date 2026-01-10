import { useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { getPatientColumns, getPatientActions } from "./components/columns";
import { usePatients } from "./hooks/usePatients";
import { PatientModal } from "./components/PatientModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import type { Patient, PatientFormData } from "./types/patients.types";
import { toast } from "sonner";

export const GestionPacientes = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const {
        patients,
        isLoading,
        createPatient,
        updatePatient,
        deletePatient,
        resetPassword
    } = usePatients();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (patientData?: Patient) => {
        setSelectedPatient(patientData || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPatient(null);
    };

    const handleOpenResetPasswordModal = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsResetPasswordModalOpen(true);
    };

    const handleCloseResetPasswordModal = () => {
        setIsResetPasswordModalOpen(false);
        setSelectedPatient(null);
    };

    const handleSubmit = (data: PatientFormData) => {
        if (selectedPatient) {
            // Actualizar
            updatePatient(
                { id: selectedPatient.guid, data },
                {
                    onSuccess: () => {
                        toast.success("Paciente actualizado exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar el paciente");
                    },
                }
            );
        } else {
            // Crear
            createPatient(data, {
                onSuccess: () => {
                    toast.success("Paciente creado exitosamente. Usuario y contraseña generados automáticamente.");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear el paciente");
                },
            });
        }
    };

    const handleResetPassword = (newPassword: string) => {
        if (selectedPatient) {
            resetPassword(
                { id: selectedPatient.guid, newPassword },
                {
                    onSuccess: () => {
                        toast.success("Contraseña reseteada exitosamente");
                        handleCloseResetPasswordModal();
                    },
                    onError: () => {
                        toast.error("Error al resetear la contraseña");
                    },
                }
            );
        }
    };

    const handleDelete = (patient: Patient) => {
        if (confirm(`¿Está seguro de eliminar al paciente ${patient.name} ${patient.surname}? Esta acción no se puede deshacer.`)) {
            deletePatient(patient.guid, {
                onSuccess: () => {
                    toast.success("Paciente eliminado exitosamente");
                },
                onError: () => {
                    toast.error("Error al eliminar el paciente");
                },
            });
        }
    };

    const patientColumns = getPatientColumns();
    const patientActions = getPatientActions(
        handleOpenModal,
        handleOpenResetPasswordModal,
        handleDelete
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Gestión de Pacientes</h2>
                    <p className="text-muted-foreground">Administración de pacientes</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nuevo Paciente
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(patients?.data) ? patients.data : []}
                    columns={patientColumns}
                    showIndex
                    actions={patientActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(patients?.data) ? patients.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <PatientModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedPatient ? {
                    name: selectedPatient.name,
                    surname: selectedPatient.surname,
                    national_number: selectedPatient.national_number || undefined,
                    email: selectedPatient.email || undefined,
                    phone: selectedPatient.phone || undefined,
                    birth_date: selectedPatient.birth_date || undefined,
                    gender: selectedPatient.gender || undefined,
                    address: selectedPatient.address || undefined,
                    is_active: selectedPatient.is_active,
                } : undefined}
                isLoading={false}
            />

            <ResetPasswordModal
                isOpen={isResetPasswordModalOpen}
                onClose={handleCloseResetPasswordModal}
                onSubmit={handleResetPassword}
                patientName={selectedPatient ? `${selectedPatient.name} ${selectedPatient.surname}` : ""}
                isLoading={false}
            />
        </div>
    )
}
