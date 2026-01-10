import { Modal } from "@/components";
import { RequestingPhysicianForm } from "./RequestingPhysicianForm";
import type { RequestingPhysicianFormData } from "../types/requesting-physicians.types";

interface RequestingPhysicianModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RequestingPhysicianFormData) => void;
    initialData?: Partial<RequestingPhysicianFormData>;
    isLoading?: boolean;
}

export const RequestingPhysicianModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: RequestingPhysicianModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Médico Solicitante" : "Nuevo Médico Solicitante"}
            description={isEditing ? "Modifique los datos del médico" : "Complete los datos del nuevo médico"}
            size="lg"
        >
            <RequestingPhysicianForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
