import { Modal } from "@/components";
import { TipoEstudioForm } from "./TipoEstudioForm";

interface TipoEstudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { description: string }) => void;
    initialData?: { description: string };
    isLoading?: boolean;
}

export const TipoEstudioModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: TipoEstudioModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Tipo de Estudio" : "Nuevo Tipo de Estudio"}
            description={isEditing ? "Modifique la descripción del tipo de estudio" : "Complete la descripción del nuevo tipo de estudio"}
            size="md"
        >
            <TipoEstudioForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
