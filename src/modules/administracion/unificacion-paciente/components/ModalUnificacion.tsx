import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";

import { Button } from "@/components/ui/button";
import { Modal, PrimaryButton } from "@/components";
import { Loader2 } from "lucide-react";

interface ModalUnificacionProps {
    isOpen: boolean;
    onClose: () => void;
    patients: Patient[];
    handleSubmitUnificacion: () => void;
    isLoading?: boolean;
}

export const ModalUnificacion = ({ isOpen, onClose, patients, handleSubmitUnificacion, isLoading = false
}: ModalUnificacionProps) => {
    if (patients.length !== 2) return null;

    const [patient1, patient2] = patients;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Unificación de Pacientes"
            size="lg"
            description={
                "Confirma la unificación de los siguientes dos pacientes en uno solo."
            }
        >
            <div className="grid grid-cols-1 gap-6 mt-4">
                {/* Primer Paciente */}
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/30">
                    <h3 className="text-lg font-semibold text-brand-purple mb-4 text-center">
                        Paciente que se Mantiene
                    </h3>
                    <div className="space-y-3 flex justify-between flex-wrap">
                        <DataRow label="Nombre" value={patient1.name} />
                        <DataRow label="Apellido" value={patient1.surname} />
                        <DataRow label="Fecha de Nacimiento" value={patient1.birthdate} />
                        <DataRow label="DNI" value={patient1.nationalcode} />
                    </div>
                </div>

                {/* Segundo Paciente */}
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/30">
                    <h3 className="text-lg font-semibold text-brand-purple mb-4 text-center">
                        Paciente que se Unifica
                    </h3>
                    <div className="space-y-3 flex justify-between flex-wrap">
                        <DataRow label="Nombre" value={patient2.name} />
                        <DataRow label="Apellido" value={patient2.surname} />
                        <DataRow label="Fecha de Nacimiento" value={patient2.birthdate} />
                        <DataRow label="DNI" value={patient2.nationalcode} />
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-6">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-300"
                >
                    Cancelar
                </Button>
                <PrimaryButton
                    onClick={() => {
                        handleSubmitUnificacion();
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Unificando...
                        </>
                    ) : (
                        "Confirmar Unificación"
                    )}
                </PrimaryButton>
            </div>
        </Modal>

    );
};

// Componente auxiliar para mostrar cada fila de datos
const DataRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
        <span className="text-sm text-gray-900 font-medium">
            {value || <span className="text-gray-400 italic">Sin dato</span>}
        </span>
    </div>
);