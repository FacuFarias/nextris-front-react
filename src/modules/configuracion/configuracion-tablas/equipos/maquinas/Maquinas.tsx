import { useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { equipmentColumns, getEquipmentActions } from "./components/columns";
import { useEquipment } from "./hooks/useEquipment";
import { EquipmentModal } from "./components/EquipmentModal";
import type { Equipment, EquipmentFormData } from "./types/equipment.types";
import { toast } from "sonner";

export const Maquinas = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    const { equipment, isLoading, createEquipment, updateEquipment } = useEquipment();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (equipmentData?: Equipment) => {
        setSelectedEquipment(equipmentData || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEquipment(null);
    };

    const handleSubmit = (data: EquipmentFormData) => {
        if (selectedEquipment) {
            // Actualizar
            updateEquipment(
                { id: selectedEquipment.guid, data },
                {
                    onSuccess: () => {
                        toast.success("Máquina actualizada exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar la máquina");
                    },
                }
            );
        } else {
            // Crear
            createEquipment(data, {
                onSuccess: () => {
                    toast.success("Máquina creada exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear la máquina");
                },
            });
        }
    };

    const equipmentActions = getEquipmentActions(handleOpenModal);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Máquinas</h2>
                    <p className="text-muted-foreground">Gestión de máquinas y equipos médicos</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nueva Máquina
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(equipment?.data) ? equipment.data : []}
                    columns={equipmentColumns}
                    showIndex
                    actions={equipmentActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(equipment?.data) ? equipment.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <EquipmentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedEquipment ? {
                    description: selectedEquipment.description,
                    modality_id: selectedEquipment.modality_id,
                    location_id: selectedEquipment.location_id || undefined,
                    aetitle: selectedEquipment.aeTitle || undefined,
                    ip: selectedEquipment.ip || undefined,
                    port: selectedEquipment.port || undefined,
                    status: selectedEquipment.status,
                } : undefined}
                isLoading={false}
            />
        </div>
    )
}
