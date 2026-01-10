import { useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { getPhysicianScheduleColumns, getPhysicianScheduleActions } from "./components/columns";
import { usePhysicianSchedules } from "./hooks/usePhysicianSchedules";
import { PhysicianScheduleModal } from "./components/PhysicianScheduleModal";
import type { PhysicianSchedule, PhysicianScheduleFormData } from "./types/physician-schedules.types";
import { toast } from "sonner";

export const AgendaMedicos = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<PhysicianSchedule | null>(null);

    const {
        schedules,
        isLoading,
        createSchedule,
        updateSchedule,
        deleteSchedule,
    } = usePhysicianSchedules();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (scheduleData?: PhysicianSchedule) => {
        setSelectedSchedule(scheduleData || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSchedule(null);
    };

    const handleSubmit = (data: PhysicianScheduleFormData) => {
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

    const handleDelete = (schedule: PhysicianSchedule) => {
        if (confirm(`¿Está seguro de eliminar la agenda de ${schedule.physician_name} para ${schedule.day}? Esta acción no se puede deshacer.`)) {
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

    const scheduleColumns = getPhysicianScheduleColumns();
    const scheduleActions = getPhysicianScheduleActions(
        handleOpenModal,
        handleDelete
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Agenda de Médicos</h2>
                    <p className="text-muted-foreground">Gestión de agendas de médicos</p>
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
                    columns={scheduleColumns}
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

            <PhysicianScheduleModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedSchedule ? {
                    physician_id: selectedSchedule.physician_id,
                    day: selectedSchedule.day,
                    time_from: selectedSchedule.time_from.substring(0, 5),
                    time_to: selectedSchedule.time_to.substring(0, 5),
                    init_day: selectedSchedule.init_day || undefined,
                    finish_day: selectedSchedule.finish_day || undefined,
                    location_id: selectedSchedule.location_id || undefined,
                } : undefined}
                isLoading={false}
            />
        </div>
    )
}
