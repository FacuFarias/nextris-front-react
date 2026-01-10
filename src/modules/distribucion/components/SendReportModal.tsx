import { Modal } from "@/components";
import { SendReportForm } from "./SendReportForm";

interface SendReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (email: string) => void;
    initialEmail?: string;
    examName?: string;
    patientName?: string;
    isLoading?: boolean;
}

export const SendReportModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialEmail,
    examName,
    patientName,
    isLoading = false,
}: SendReportModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Enviar Informe por Email"
            description="Envíe el informe médico en formato PDF al paciente"
            size="md"
        >
            <SendReportForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialEmail={initialEmail}
                examName={examName}
                patientName={patientName}
                isLoading={isLoading}
            />
        </Modal>
    );
};
