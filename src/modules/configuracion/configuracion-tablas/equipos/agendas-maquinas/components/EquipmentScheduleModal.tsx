import { Modal } from "@/components";
import { EquipmentScheduleForm } from "./EquipmentScheduleForm";
import type { EquipmentScheduleFormData } from "../types/equipment-schedules.types";

interface EquipmentScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EquipmentScheduleFormData) => void;
    initialData?: Partial<EquipmentScheduleFormData>;
    isLoading?: boolean;
}

export const EquipmentScheduleModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: EquipmentScheduleModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Agenda" : "Nueva Agenda"}
            description={isEditing ? "Modifique los datos de la agenda" : "Complete los datos de la nueva agenda"}
            size="lg"
        >
            <EquipmentScheduleForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
