import { Modal } from "@/components";
import type { ObraSocialFormData } from "../types/obras-sociales.types";
import { ObraSocialForm } from "./ObraSocialForm";

interface ObraSocialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ObraSocialFormData) => void;
    initialData?: Partial<ObraSocialFormData> | null;
    isLoading?: boolean;
}

export const ObraSocialModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: ObraSocialModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Obra Social" : "Nueva Obra Social"}
            description={isEditing ? "Modifique los datos de la obra social" : "Complete los datos de la nueva obra social"}
            size="lg"
        >
            <ObraSocialForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
