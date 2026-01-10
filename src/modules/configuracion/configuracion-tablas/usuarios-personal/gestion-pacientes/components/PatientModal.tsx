import { Modal } from "@/components";
import { PatientForm } from "./PatientForm";
import type { PatientFormData } from "../types/patients.types";

interface PatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PatientFormData) => void;
    initialData?: Partial<PatientFormData>;
    isLoading?: boolean;
}

export const PatientModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: PatientModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Paciente" : "Nuevo Paciente"}
            description={isEditing ? "Modifique los datos del paciente" : "Complete los datos del nuevo paciente"}
            size="lg"
        >
            <PatientForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
                isEditing={isEditing}
            />
        </Modal>
    );
};
