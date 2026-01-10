import { Modal } from "@/components";
import { PhysicianScheduleForm } from "./PhysicianScheduleForm";
import type { PhysicianScheduleFormData } from "../types/physician-schedules.types";

interface PhysicianScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PhysicianScheduleFormData) => void;
    initialData?: Partial<PhysicianScheduleFormData>;
    isLoading?: boolean;
}

export const PhysicianScheduleModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: PhysicianScheduleModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Agenda de Médico" : "Nueva Agenda de Médico"}
            description={isEditing ? "Modifique los datos de la agenda" : "Complete los datos de la nueva agenda"}
            size="lg"
        >
            <PhysicianScheduleForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
            />
        </Modal>
    );
};
