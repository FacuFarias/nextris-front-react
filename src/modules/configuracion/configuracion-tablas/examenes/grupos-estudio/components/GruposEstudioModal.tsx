import { Modal } from "@/components";
import { GruposEstudioForm } from "./GruposEstudioForm";

interface GruposEstudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { description: string }) => void;
    initialData?: { description: string };
    isLoading?: boolean;
}

export const GruposEstudioModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: GruposEstudioModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Grupo de Estudio" : "Nuevo Grupo de Estudio"}
            description={isEditing ? "Modifique la descripción del grupo de estudio" : "Complete la descripción del nuevo grupo de estudio"}
            size="md"
        >
            <GruposEstudioForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
