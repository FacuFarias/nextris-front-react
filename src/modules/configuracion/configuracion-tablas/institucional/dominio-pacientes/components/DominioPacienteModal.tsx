import { Modal } from "@/components";
import type { DominioPacienteFormData } from "../types/dominio-pacientes.types";
import { DominioPacienteForm } from "./DominioPacienteForm";

interface DominioPacienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: DominioPacienteFormData) => void;
    initialData?: Partial<DominioPacienteFormData> | null;
    isLoading?: boolean;
}

export const DominioPacienteModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: DominioPacienteModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Dominio de Paciente" : "Nuevo Dominio de Paciente"}
            description={isEditing ? "Modifique los datos del dominio" : "Complete los datos del nuevo dominio"}
            size="lg"
        >
            <DominioPacienteForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
