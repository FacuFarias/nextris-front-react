import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";

import { Button } from "@/components/ui/button";
import { Modal, PrimaryButton } from "@/components";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/fechaYhora";

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
            <div className="grid grid-cols-1 gap-6">
                {/* Primer Paciente - SE MANTIENE (VERDE) */}
                <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50/50 shadow-md">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-bold text-green-700">
                            Paciente que se Mantiene
                        </h3>
                    </div>
                    <div className="space-y-3 flex justify-between flex-wrap">
                        <DataRow label="Nombre" value={patient1.name} color="green" />
                        <DataRow label="Apellido" value={patient1.surname} color="green" />
                        <DataRow label="Fecha de Nacimiento" value={formatDate(patient1.birthdate)} color="green" />
                        <DataRow label="DNI" value={patient1.nationalcode} color="green" />
                    </div>
                </div>

                {/* Segundo Paciente - SE UNIFICA (ROJO) */}
                <div className="border-2 border-red-800 rounded-lg p-4 bg-red-50/50 shadow-md">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <XCircle className="w-6 h-6 text-red-700" />
                        <h3 className="text-lg font-bold text-red-800">
                            Paciente que se Unifica (será eliminado)
                        </h3>
                    </div>
                    <div className="space-y-3 flex justify-between flex-wrap">
                        <DataRow label="Nombre" value={patient2.name} color="red" />
                        <DataRow label="Apellido" value={patient2.surname} color="red" />
                        <DataRow label="Fecha de Nacimiento" value={formatDate(patient2.birthdate)} color="red" />
                        <DataRow label="DNI" value={patient2.nationalcode} color="red" />
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-6">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-300"
                    disabled={isLoading}
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
const DataRow = ({ label, value, color }: { label: string; value: string | null | undefined; color: 'green' | 'red' }) => {
    const colorClasses = color === 'green'
        ? 'text-green-700'
        : 'text-red-700';

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600 uppercase">{label}</span>
            <span className={`text-sm font-semibold ${colorClasses}`}>
                {value || <span className="text-gray-400 italic">Sin dato</span>}
            </span>
        </div>
    );
};
