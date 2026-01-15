import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { AlertCircle } from "lucide-react";

interface AddendumAlertProps {
    isOpen: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export const AddendumAlert = ({
    isOpen,
    onAccept,
    onDecline
}: AddendumAlertProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { }} // No hacer nada al intentar cerrar
            title="Estudio Finalizado"
            size="md"
            showCloseButton={false} // Ocultar el botón X
            closeOnOutsideClick={false} // No cerrar al hacer clic fuera
        >
            <div className="space-y-6">
                {/* Alerta informativa */}
                <div className="bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900">
                            Este estudio ya está finalizado
                        </p>
                        <p className="text-sm text-amber-700 mt-2">
                            El informe ya ha sido guardado y finalizado. ¿Desea crear un addendum para agregar información adicional?
                        </p>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-2 justify-end">
                    <SecondaryButton onClick={onDecline}>
                        No
                    </SecondaryButton>
                    <PrimaryButton onClick={onAccept}>
                        Sí, crear addendum
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
