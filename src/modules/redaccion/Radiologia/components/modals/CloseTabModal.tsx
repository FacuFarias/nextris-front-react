import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components";
import { AlertCircle, ChevronRight, X } from "lucide-react";

interface CloseTabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCloseTab: () => void;
    onStay: () => void;
}

export const CloseTabModal = ({
    isOpen,
    onClose,
    onCloseTab,
    onStay
}: CloseTabModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Informe Firmado"
            size="md"
        >
            <div className="space-y-6">
                {/* Alerta informativa */}
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                            ¡Informe firmado exitosamente!
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                            No hay más exámenes pendientes por revisar en este momento.
                        </p>
                    </div>
                </div>

                {/* Mensaje */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 text-center">
                        ¿Deseas cerrar esta pestaña?
                    </p>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-2 justify-end">
                    <SecondaryButton onClick={onStay}>
                        <X className="h-5 w-5 mr-2" />
                        Permanecer aquí
                    </SecondaryButton>
                    <PrimaryButton onClick={onCloseTab}>
                        <ChevronRight className="h-5 w-5 mr-2" />
                        Cerrar pestaña
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};