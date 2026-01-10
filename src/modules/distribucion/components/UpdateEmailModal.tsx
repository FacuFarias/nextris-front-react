import { Modal } from "@/components";
import { UpdateEmailForm } from "./UpdateEmailForm";

interface UpdateEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (email: string) => void;
    initialEmail?: string;
    patientName?: string;
    isLoading?: boolean;
}

export const UpdateEmailModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialEmail,
    patientName,
    isLoading = false,
}: UpdateEmailModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Actualizar Email"
            description={`Actualice el email del paciente: ${patientName || ''}`}
            size="md"
        >
            <UpdateEmailForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialEmail={initialEmail}
                isLoading={isLoading}
            />
        </Modal>
    );
};
