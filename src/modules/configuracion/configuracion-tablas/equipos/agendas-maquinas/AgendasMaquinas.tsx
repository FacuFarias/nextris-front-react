import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import type { TableAction, TableColumn } from "@/types/table";
import type { EquipmentSchedule, EquipmentScheduleFormData, EquipmentSchedulePayload } from "./types/equipment-schedules.types";
import { useEquipment } from "../maquinas/hooks/useEquipment";
import type { Equipment } from "../maquinas/types/equipment.types";
import {
    useEquipmentSchedules,
    useCreateEquipmentSchedule,
    useUpdateEquipmentSchedule,
    useDeleteEquipmentSchedule,
} from "./hooks";

const DAYS_ORDER = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const DAYS_MAP: Record<string, string> = {
    "domingo": "Domingo",
    "lunes": "Lunes",
    "martes": "Martes",
    "miércoles": "Miércoles",
    "jueves": "Jueves",
    "viernes": "Viernes",
    "sábado": "Sábado",
};

// Mapa para convertir día (string) a número (0-6)
const DAY_TO_NUMBER: Record<string, number> = {
    "domingo": 0,
    "lunes": 1,
    "martes": 2,
    "miércoles": 3,
    "jueves": 4,
    "viernes": 5,
    "sábado": 6,
};

export const AgendasMaquinas = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<EquipmentSchedule | null>(null);
    const [equipmentPage, setEquipmentPage] = useState(1);
    const [equipmentPageSize, setEquipmentPageSize] = useState(8);
    const [schedulesPage, setSchedulesPage] = useState(1);
    const [schedulesPageSize, setSchedulesPageSize] = useState(8);
    const [scheduleToDelete, setScheduleToDelete] = useState<EquipmentSchedule | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formData, setFormData] = useState<EquipmentScheduleFormData>({
        day: "lunes",
        time_from: "08:00",
        time_to: "16:00",
    });

    const { equipment, isLoading } = useEquipment();

    // Hooks personalizados para operaciones de agendas
    const { data: schedulesData, isLoading: loadingSchedules } = useEquipmentSchedules(selectedEquipment?.guid);
    const createMutation = useCreateEquipmentSchedule(selectedEquipment?.guid);
    const updateMutation = useUpdateEquipmentSchedule(selectedEquipment?.guid);
    const deleteMutation = useDeleteEquipmentSchedule(selectedEquipment?.guid);

    const filteredEquipment = equipment?.data?.filter((eq) =>
        eq.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.modality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.aeTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEquipment) {
            toast.error("Seleccione un equipo");
            return;
        }

        // Convertir el día a número antes de enviar
        const dataToSend: EquipmentSchedulePayload = {
            ...formData,
            day: DAY_TO_NUMBER[formData.day]
        };
        if (editingSchedule) {
            updateMutation.mutate(
                { scheduleId: editingSchedule.guid, formData: dataToSend as any },
                {
                    onSuccess: () => {
                        resetForm();
                        setIsFormModalOpen(false);
                    }
                }
            );
        } else {
            createMutation.mutate(dataToSend as any, {
                onSuccess: () => {
                    resetForm();
                    setIsFormModalOpen(false);
                }
            });
        }
    };

    const handleEdit = (schedule: EquipmentSchedule) => {
        setEditingSchedule(schedule);
        setFormData({
            day: schedule.day,
            time_from: schedule.time_from,
            time_to: schedule.time_to,
        });
        setIsFormModalOpen(true);
    };

    const handleDelete = (schedule: EquipmentSchedule) => {
        setScheduleToDelete(schedule);
    };

    const confirmDelete = () => {
        if (scheduleToDelete) {
            deleteMutation.mutate(scheduleToDelete.guid, {
                onSuccess: () => {
                    setScheduleToDelete(null);
                }
            });
        }
    };

    const resetForm = () => {
        setEditingSchedule(null);
        setFormData({
            day: "lunes",
            time_from: "08:00",
            time_to: "16:00",
        });
    };

    const handleOpenFormModal = () => {
        resetForm();
        setIsFormModalOpen(true);
    };

    // Ordenar schedules por día
    const sortedSchedules = schedulesData?.data?.sort((a, b) => {
        const indexA = DAYS_ORDER.indexOf(a.day);
        const indexB = DAYS_ORDER.indexOf(b.day);
        return indexA - indexB;
    }) || [];

    const equipmentColumns: TableColumn<Equipment>[] = [
        { key: "aeTitle", label: "AETitle" },
        { key: "modality", label: "Modalidad" },
        { key: "ip", label: "IP" },
    ];

    const scheduleColumns: TableColumn<EquipmentSchedule>[] = [
        {
            key: "day",
            label: "Dia",
            render: (value) => <span className="capitalize">{DAYS_MAP[value as string] || value}</span>,
        },
        { key: "time_from", label: "Inicio" },
        { key: "time_to", label: "Final" },
    ];

    const scheduleActions: TableAction<EquipmentSchedule>[] = [
        {
            label: "Editar agenda",
            icon: <Edit className="h-4 w-4" />,
            onClick: (schedule) => handleEdit(schedule),
        },
        {
            label: "Eliminar agenda",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (schedule) => handleDelete(schedule),
            variant: "destructive",
        },
    ];


    // Reset página cuando cambie el filtro
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setEquipmentPage(1);
    };
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Tabla de Equipos - Izquierda */}
                <Card className="p-0 h-fit">
                    <CardContent className="py-2">
                        <Input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="mb-4"
                        />
                        <TablaDynamic<Equipment>
                            data={filteredEquipment}
                            columns={equipmentColumns}
                            loading={isLoading}
                            selectedRow={selectedEquipment}
                            rowIdKey="guid"
                            onRowClick={(equipmentRow) => {
                                setSelectedEquipment(equipmentRow);
                                setSchedulesPage(1);
                            }}
                            pagination={{
                                page: equipmentPage,
                                pageSize: equipmentPageSize,
                                serverSide: false,
                                total: filteredEquipment.length,
                            }}
                            onPaginationChange={(newPage, newPageSize) => {
                                setEquipmentPage(newPage);
                                setEquipmentPageSize(newPageSize);
                            }}
                            perPageValue={equipmentPageSize}
                            onPerPageChange={(value) => {
                                setEquipmentPageSize(value);
                                setEquipmentPage(1);
                            }}
                            emptyMessage={searchTerm ? "No se encontraron equipos" : "No hay equipos disponibles"}
                        />
                    </CardContent>
                </Card>

                {/* Panel de Días - Derecha */}
                <div className="space-y-4">
                    <Card className="py-0">
                        <CardContent className="p-4">
                            <div className="flex justify-end gap-2 mb-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full bg-brand-purple hover:bg-purple-700 text-white"
                                    disabled={!selectedEquipment || loadingSchedules}
                                    onClick={handleOpenFormModal}
                                >
                                    <Plus className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                            {!selectedEquipment ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="text-lg font-medium">Seleccione un equipo</p>
                                    <p className="text-sm">para ver sus días de agenda</p>
                                </div>
                            ) : loadingSchedules ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
                                </div>
                            ) : (
                                <TablaDynamic<EquipmentSchedule>
                                    data={sortedSchedules}
                                    columns={scheduleColumns}
                                    actions={scheduleActions}
                                    pagination={{
                                        page: schedulesPage,
                                        pageSize: schedulesPageSize,
                                        serverSide: false,
                                        total: sortedSchedules.length,
                                    }}
                                    onPaginationChange={(newPage, newPageSize) => {
                                        setSchedulesPage(newPage);
                                        setSchedulesPageSize(newPageSize);
                                    }}
                                    perPageValue={schedulesPageSize}
                                    onPerPageChange={(value) => {
                                        setSchedulesPageSize(value);
                                        setSchedulesPage(1);
                                    }}
                                    emptyMessage="No hay dias de agenda configurados"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal de formulario de creación/edición */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    resetForm();
                }}
                title={editingSchedule ? "Editar Día de Agenda" : "Nuevo Día de Agenda"}
                description={editingSchedule ? "Modifique los datos de la agenda" : "Complete los datos de la nueva agenda"}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="day" className="text-sm font-medium mb-1 block">Día</Label>
                        <Select
                            value={formData.day}
                            onValueChange={(value) => {
                                setFormData({ ...formData, day: value });
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccione un día" />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS_ORDER.map((day) => (
                                    <SelectItem key={day} value={day} className="capitalize">
                                        {DAYS_MAP[day]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="time_from" className="text-sm font-medium mb-1 block">Hora Inicio</Label>
                            <Input
                                id="time_from"
                                type="time"
                                value={formData.time_from}
                                onChange={(e) =>
                                    setFormData({ ...formData, time_from: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="time_to" className="text-sm font-medium mb-1 block">Hora Final</Label>
                            <Input
                                id="time_to"
                                type="time"
                                value={formData.time_to}
                                onChange={(e) =>
                                    setFormData({ ...formData, time_to: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsFormModalOpen(false);
                                resetForm();
                            }}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-brand-purple hover:bg-brand-purple/90"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {createMutation.isPending || updateMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : editingSchedule ? (
                                "Actualizar"
                            ) : (
                                "Crear"
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal de confirmación de eliminación */}
            <Modal
                isOpen={!!scheduleToDelete}
                onClose={() => setScheduleToDelete(null)}
                title="Confirmar Eliminación"
                description="Esta acción no se puede deshacer"
                size="md"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">
                            ¿Está seguro que desea eliminar la agenda del día{" "}
                            <span className="font-semibold text-gray-900">
                                {scheduleToDelete && DAYS_MAP[scheduleToDelete.day]}
                            </span>
                            ?
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                    Horario:{" "}
                    <span className="font-medium">
                        {scheduleToDelete?.time_from} - {scheduleToDelete?.time_to}
                    </span>
                </p>

                <div className="flex gap-2 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setScheduleToDelete(null)}
                        disabled={deleteMutation.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={confirmDelete}
                        disabled={deleteMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {deleteMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </>
                        )}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
