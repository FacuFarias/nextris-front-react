import { Modal } from "@/components";
import { TipoEstudioForm } from "./TipoEstudioForm";
import type { TipoEstudioFormData } from "../types/tipos-estudio.types";

interface TipoEstudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TipoEstudioFormData) => void;
    initialData?: Partial<TipoEstudioFormData>;
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
            description={isEditing ? "Modifique los datos del tipo de estudio" : "Complete los datos del nuevo tipo de estudio"}
            size="lg"
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
