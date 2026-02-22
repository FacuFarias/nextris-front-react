import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient } from "../types/BuscarPaciente";
import { useCrearUsuarioPaciente } from "../hooks/use-buscar-paciente";

interface CrearUsuarioPacienteProps {
    patient: Patient | null;
    onClose?: () => void;
}

export const CrearUsuarioPaciente = ({ patient, onClose }: CrearUsuarioPacienteProps) => {
    const { mutate, isPending } = useCrearUsuarioPaciente();

    const handleCrear = () => {
        if (patient?.guid) {
            mutate(patient.guid, {
                onSuccess: () => onClose?.(),
            });
        }
    };

    return (
        <div className="py-6 px-2">
            <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-purple-100 dark:bg-purple-950/30 rounded-full animate-pulse" />
                    <div className="relative bg-purple-50 dark:bg-purple-950/50 rounded-full p-4 border-4 border-purple-100 dark:border-purple-900/50">
                        <UserPlus className="w-12 h-12 text-brand-purple dark:text-purple-400" strokeWidth={2} />
                    </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Crear usuario para el paciente
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                    Se creará un usuario para{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {patient?.name} {patient?.surname}
                    </span>
                    . La contraseña inicial será <span className="font-mono font-semibold">next</span> y deberá cambiarla en el primer ingreso.
                </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
                <Button
                    variant="outline"
                    className="flex-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={onClose}
                    disabled={isPending}
                >
                    Cancelar
                </Button>
                <Button
                    className="flex-1 bg-brand-purple hover:bg-purple-700 text-white cursor-pointer"
                    onClick={handleCrear}
                    disabled={isPending}
                >
                    {isPending ? "Creando..." : "Crear usuario"}
                </Button>
            </div>
        </div>
    );
};
