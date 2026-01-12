import { Modal } from "@/components";
import { ModalidadForm } from "./ModalidadForm";

interface ModalidadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { description: string, externalcode: string }) => void;
    initialData?: { description: string, externalcode: string };
    isLoading?: boolean;
}

export const ModalidadModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: ModalidadModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Modalidad" : "Nueva Modalidad"}
            description={isEditing ? "Modifique la descripción de la modalidad" : "Complete la descripción de la nueva modalidad"}
            size="md"
        >
            <ModalidadForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
