import { useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { equipmentScheduleColumns, getEquipmentScheduleActions } from "./components/columns";
import { useEquipmentSchedules } from "./hooks/useEquipmentSchedules";
import { EquipmentScheduleModal } from "./components/EquipmentScheduleModal";
import type { EquipmentSchedule, EquipmentScheduleFormData } from "./types/equipment-schedules.types";
import { toast } from "sonner";

export const AgendasMaquinas = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<EquipmentSchedule | null>(null);

    const { schedules, isLoading, createSchedule, updateSchedule, deleteSchedule } = useEquipmentSchedules();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (scheduleData?: EquipmentSchedule) => {
        setSelectedSchedule(scheduleData || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSchedule(null);
    };

    const handleSubmit = (data: EquipmentScheduleFormData) => {
        if (selectedSchedule) {
            // Actualizar
            updateSchedule(
                { id: selectedSchedule.guid, data },
                {
                    onSuccess: () => {
                        toast.success("Agenda actualizada exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar la agenda");
                    },
                }
            );
        } else {
            // Crear
            createSchedule(data, {
                onSuccess: () => {
                    toast.success("Agenda creada exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear la agenda");
                },
            });
        }
    };

    const handleDelete = (schedule: EquipmentSchedule) => {
        if (confirm(`¿Está seguro de eliminar la agenda de ${schedule.equipment_name} - ${schedule.day}?`)) {
            deleteSchedule(schedule.guid, {
                onSuccess: () => {
                    toast.success("Agenda eliminada exitosamente");
                },
                onError: () => {
                    toast.error("Error al eliminar la agenda");
                },
            });
        }
    };

    const scheduleActions = getEquipmentScheduleActions(handleOpenModal, handleDelete);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Agendas de Máquinas</h2>
                    <p className="text-muted-foreground">Gestión de agendas y disponibilidad de máquinas</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nueva Agenda
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(schedules?.data) ? schedules.data : []}
                    columns={equipmentScheduleColumns}
                    showIndex
                    actions={scheduleActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(schedules?.data) ? schedules.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <EquipmentScheduleModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedSchedule ? {
                    equipment_id: selectedSchedule.equipment_id,
                    day: selectedSchedule.day,
                    time_from: selectedSchedule.time_from.substring(0, 5), // HH:MM
                    time_to: selectedSchedule.time_to.substring(0, 5), // HH:MM
                } : undefined}
                isLoading={false}
            />
        </div>
    )
}
