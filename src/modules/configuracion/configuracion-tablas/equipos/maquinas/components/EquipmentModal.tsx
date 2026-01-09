import { Modal } from "@/components";
import { EquipmentForm } from "./EquipmentForm";
import type { EquipmentFormData } from "../types/equipment.types";

interface EquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EquipmentFormData) => void;
    initialData?: Partial<EquipmentFormData>;
    isLoading?: boolean;
}

export const EquipmentModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: EquipmentModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Máquina" : "Nueva Máquina"}
            description={isEditing ? "Modifique los datos de la máquina" : "Complete los datos de la nueva máquina"}
            size="lg"
        >
            <EquipmentForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
