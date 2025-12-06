import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient } from "../types/BuscarPaciente";
import { useEliminarPaciente } from "../hooks/use-buscar-paciente";

interface EliminarPacienteProps {
    patient: Patient | null;
    onClose?: () => void;
}
export const EliminarPaciente = ({ patient, onClose }: EliminarPacienteProps) => {
    const { mutate: eliminarPacienteMutate } = useEliminarPaciente();

    const eliminarPaciente = () => {
        if (patient?.guid) {
            eliminarPacienteMutate(patient.guid, {
                onSuccess: () => {
                    onClose?.();
                }
            });
        }
    }
    return (
        <div className="py-6 px-2">
            {/* Icono y contenedor principal */}
            <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                    {/* Círculo de fondo animado */}
                    <div className="absolute inset-0 bg-red-100 dark:bg-red-950/30 rounded-full animate-pulse" />
                    {/* Icono */}
                    <div className="relative bg-red-50 dark:bg-red-950/50 rounded-full p-4 border-4 border-red-100 dark:border-red-900/50">
                        <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-500" strokeWidth={2} />
                    </div>
                </div>

                {/* Título */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    ¿Eliminar paciente?
                </h3>

                {/* Descripción */}
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                    Esta acción es <span className="font-semibold text-red-800 dark:text-red-500">permanente</span> y no se puede deshacer.
                    Todos los datos del paciente serán eliminados del sistema.
                </p>
            </div>

            {/* Botones */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
                <Button
                    variant="outline"
                    className="flex-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    Cancelar
                </Button>
                <Button
                    className="flex-1 bg-red-800 hover:bg-red-700 text-white cursor-pointer"
                    onClick={eliminarPaciente}
                >
                    Sí, eliminar paciente
                </Button>
            </div>
        </div>
    )
}
