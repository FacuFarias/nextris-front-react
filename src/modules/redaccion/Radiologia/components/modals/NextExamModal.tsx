import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components";
import { AlertCircle, ChevronRight, X } from "lucide-react";

interface NextExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    nextExamData: any;
    onOpenNextExam: () => void;
    onSkip: () => void;
}

export const NextExamModal = ({
    isOpen,
    onClose,
    nextExamData,
    onOpenNextExam,
    onSkip
}: NextExamModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Siguiente Examen Disponible"
            size="md"
        >
            <div className="space-y-6">
                {/* Alerta informativa */}
                <div className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                            ¡Informe firmado exitosamente!
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                            Hay un siguiente examen disponible para revisar. ¿Deseas abrirlo ahora?
                        </p>
                    </div>
                </div>

                {/* Información del siguiente examen */}
                {nextExamData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-gray-900">Detalles del siguiente examen:</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Paciente:</span>
                                <span className="font-medium text-gray-900">{nextExamData.patient_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">N° Registro:</span>
                                <span className="font-medium text-gray-900">{nextExamData.admission_number}</span>
                            </div>
                            {nextExamData.study_description && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Estudio:</span>
                                    <span className="font-medium text-gray-900">{nextExamData.study_description}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-2 justify-end">
                    <SecondaryButton onClick={onSkip}>
                        <X className="h-5 w-5 mr-2" />
                        Ahora no
                    </SecondaryButton>
                    <PrimaryButton onClick={onOpenNextExam}>
                        <ChevronRight className="h-5 w-5 mr-2" />
                        Abrir siguiente examen
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};