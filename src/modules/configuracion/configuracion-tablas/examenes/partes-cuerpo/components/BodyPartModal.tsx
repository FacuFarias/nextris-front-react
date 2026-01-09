import { Modal } from "@/components";
import { BodyPartForm } from "./BodyPartForm";

interface BodyPartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { description: string }) => void;
    initialData?: { description: string };
    isLoading?: boolean;
}

export const BodyPartModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: BodyPartModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Parte del Cuerpo" : "Nueva Parte del Cuerpo"}
            description={isEditing ? "Modifique la descripción de la parte del cuerpo" : "Complete la descripción de la nueva parte del cuerpo"}
            size="md"
        >
            <BodyPartForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
