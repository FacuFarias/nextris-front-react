import { Modal } from "@/components";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { Admision } from "../types/admision.type";
import { useEquiposPorLocacion } from "@/hooks/use-global";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check } from "lucide-react";
import { useState } from "react";

interface ModalAdmisionProps {
    isOpen: boolean;
    onClose: () => void;
    admisionData: Admision | null;
    onConfirm: (data: Admision) => void;
}

export const ModalAdmision = ({ isOpen, onClose, admisionData, onConfirm }: ModalAdmisionProps) => {

    /*     const { admisionData: detailData, isLoading } = useAdmisionDetail(admisionData?.guid);
     */
    const { data } = useEquiposPorLocacion(admisionData ? admisionData.location : "", admisionData ? admisionData.modality_id : "");;
    const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>(admisionData?.equipo || "");

    const handleConfirm = () => {
        if (admisionData) {
            // Actualizar el equipo seleccionado antes de confirmar
            const admisionActualizada = {
                ...admisionData,
                equipo: equipoSeleccionado
            };
            onConfirm(admisionActualizada);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirmar Admisión"
            description="Revisa los detalles antes de admisionar"
            size="lg"
        >
            {admisionData === null ? (
                <div className="flex justify-center items-center py-8">
                    <span className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></span>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Información del Paciente */}
                    <div className="bg-gray-50 dark:bg-[#2a2e32] rounded-lg p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2 dark:text-gray-200">Información del Paciente</h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-200">Nombre</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{admisionData.fullname}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-200">Estudio</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{admisionData.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-brand-purple">
                                <TableRow className="hover:bg-purple-800 dark:bg-brand-purple/80">
                                    <TableHead className="text-white">AE Title</TableHead>
                                    <TableHead className="text-white">Descripción</TableHead>
                                    <TableHead className="text-white">Modalidad</TableHead>
                                    <TableHead className="text-white text-center">Asignado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data && data.length > 0 ? (
                                    data.map((equipo) => {
                                        const isAsignado = equipo.guid === equipoSeleccionado;
                                        return (
                                            <TableRow
                                                key={equipo.guid}
                                                onClick={() => setEquipoSeleccionado(equipo.guid)}
                                                className={`cursor-pointer transition-all ${isAsignado ? "bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500 dark:bg-green-900 dark:hover:bg-green-800" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                                            >
                                                <TableCell className="font-medium">{equipo.aeTitle}</TableCell>
                                                <TableCell>{equipo.description}</TableCell>
                                                <TableCell>{equipo.modality}</TableCell>
                                                <TableCell className="text-center">
                                                    {isAsignado && (
                                                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground dark:text-gray-400">
                                            No hay equipos disponibles
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton onClick={onClose}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton onClick={handleConfirm} disabled={false}>
                            Confirmar Admisión
                        </PrimaryButton>
                    </div>
                </div>
            )}
        </Modal>
    );
};
