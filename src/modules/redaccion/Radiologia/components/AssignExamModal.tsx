import { Modal } from "@/components/Modal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components";
import { UserCheck, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMedicosAll } from "@/services/api-global.service";
import { toast } from "sonner";

interface AssignExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    examId: string;
    currentAssigneeName?: string;
    onAssign: (userId: string) => Promise<void>;
}

export const AssignExamModal = ({
    isOpen,
    onClose,
    currentAssigneeName,
    onAssign,
}: AssignExamModalProps) => {
    const { data: medicos, isLoading } = useQuery({
        queryKey: ['medicos-all'],
        queryFn: getMedicosAll,
        staleTime: 5 * 60 * 1000,
    });

    const [selectedUserId, setSelectedUserId] = React.useState<string>("");
    const [isAssigning, setIsAssigning] = React.useState(false);

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error("Seleccione un radiólogo");
            return;
        }
        setIsAssigning(true);
        try {
            await onAssign(selectedUserId);
            onClose();
        } catch {
            // Error already handled in hook
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Asignar Estudio"
            size="md"
        >
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <UserCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                            Asignar a radiólogo
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                            Seleccione el radiólogo al cual asignar este estudio para su redacción.
                        </p>
                    </div>
                </div>

                {currentAssigneeName && (
                    <div className="text-sm text-gray-500">
                        Actualmente asignado a: <span className="font-medium text-gray-700">{currentAssigneeName}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                        Radiólogo
                    </label>
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Cargando radiólogos...</span>
                        </div>
                    ) : (
                        <select
                            className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:border-brand-purple focus:ring-brand-purple text-base"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="">Seleccione un radiólogo...</option>
                            {medicos?.map((medico: { guid: string; name: string }) => (
                                <option key={medico.guid} value={medico.guid}>
                                    {medico.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex gap-3 pt-2 justify-end">
                    <SecondaryButton onClick={onClose}>
                        <X className="h-5 w-5 mr-2" />
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton
                        onClick={handleAssign}
                        disabled={!selectedUserId || isAssigning}
                    >
                        {isAssigning ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Asignando...
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-5 w-5 mr-2" />
                                Asignar
                            </>
                        )}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};

import React from "react";
