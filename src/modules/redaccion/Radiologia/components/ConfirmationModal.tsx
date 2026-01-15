import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { AlertTriangle, X, CheckCircle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "warning" | "danger" | "info";
    isLoading?: boolean;
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "warning",
    isLoading = false
}: ConfirmationModalProps) => {
    const getVariantStyles = () => {
        switch (variant) {
            case "danger":
                return {
                    bgColor: "from-red-50 to-orange-50",
                    borderColor: "border-red-200",
                    iconColor: "text-red-600",
                    textColor: "text-red-900",
                    descColor: "text-red-700"
                };
            case "info":
                return {
                    bgColor: "from-blue-50 to-cyan-50",
                    borderColor: "border-blue-200",
                    iconColor: "text-blue-600",
                    textColor: "text-blue-900",
                    descColor: "text-blue-700"
                };
            case "warning":
            default:
                return {
                    bgColor: "from-yellow-50 to-amber-50",
                    borderColor: "border-yellow-200",
                    iconColor: "text-yellow-600",
                    textColor: "text-yellow-900",
                    descColor: "text-yellow-700"
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="md"
        >
            <div className="space-y-6">
                {/* Alerta informativa */}
                <div className={`bg-linear-to-r ${styles.bgColor} border ${styles.borderColor} rounded-xl p-4 flex items-start gap-3`}>
                    <AlertTriangle className={`h-6 w-6 ${styles.iconColor} shrink-0 mt-0.5`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${styles.textColor}`}>
                            Advertencia:
                        </p>
                        <p className={`text-sm ${styles.descColor} mt-1`}>
                            {message}
                        </p>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-2 justify-end">
                    <SecondaryButton
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        <X className="h-5 w-5 mr-2" />
                        {cancelText}
                    </SecondaryButton>
                    <PrimaryButton
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {isLoading ? 'Procesando...' : confirmText}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
