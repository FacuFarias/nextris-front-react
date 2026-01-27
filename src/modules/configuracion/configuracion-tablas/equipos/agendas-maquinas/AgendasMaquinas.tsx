import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [scheduleToDelete, setScheduleToDelete] = useState<EquipmentSchedule | null>(null);
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
                { onSuccess: () => resetForm() }
            );
        } else {
            createMutation.mutate(dataToSend as any, { onSuccess: () => resetForm() });
        }
    };

    const handleEdit = (schedule: EquipmentSchedule) => {
        setEditingSchedule(schedule);
        setFormData({
            day: schedule.day,
            time_from: schedule.time_from,
            time_to: schedule.time_to,
        });
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

    // Ordenar schedules por día
    const sortedSchedules = schedulesData?.data?.sort((a, b) => {
        const indexA = DAYS_ORDER.indexOf(a.day);
        const indexB = DAYS_ORDER.indexOf(b.day);
        return indexA - indexB;
    }) || [];


    // Paginación
    const totalItems = filteredEquipment.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEquipment = filteredEquipment.slice(startIndex, endIndex);

    // Reset página cuando cambie el filtro
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold">Agendas de Equipos</h2>
                <p className="text-muted-foreground">Gestión de horarios de disponibilidad de equipos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tabla de Equipos - Izquierda */}
                <Card className="p-0">
                    <CardHeader className="bg-brand-purple text-white rounded-t-lg p-4">
                        <CardTitle className="text-lg font-bold uppercase">Agendas de Equipos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <Input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="mb-4"
                        />

                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-brand-purple text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase">AETitle</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Modalidad</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase">IP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedEquipment.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-gray-500 italic">
                                                    {searchTerm ? "No se encontraron equipos" : "No hay equipos disponibles"}
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedEquipment.map((equipment, idx) => (
                                                <tr
                                                    key={equipment.guid}
                                                    className={`cursor-pointer border-b hover:bg-purple-50 transition-colors ${selectedEquipment?.guid === equipment.guid
                                                        ? "bg-purple-100"
                                                        : idx % 2 === 0
                                                            ? "bg-gray-50"
                                                            : "bg-white"
                                                        }`}
                                                    onClick={() => setSelectedEquipment(equipment)}
                                                >
                                                    <td className="px-4 py-3 text-sm">{equipment.aeTitle || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{equipment.modality || "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{equipment.ip || "-"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <p className="text-sm text-gray-600">
                                    Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems} equipos
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <Button
                                                key={page}
                                                size="sm"
                                                variant={currentPage === page ? "default" : "outline"}
                                                className={currentPage === page ? "bg-brand-purple hover:bg-brand-purple/90" : ""}
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Panel de Días - Derecha */}
                <div className="space-y-6">
                    <Card className="py-0">
                        <CardHeader className="p-4 bg-brand-purple text-white rounded-t-lg flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold uppercase">Días de Agenda</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full bg-brand-purple hover:bg-purple-700 text-white"
                                    disabled={!selectedEquipment || loadingSchedules}
                                    onClick={resetForm}
                                >
                                    <Plus className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
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
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-brand-purple text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Día</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Inicio</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase">Final</th>
                                                <th className="px-4 py-3 text-center text-sm font-semibold uppercase">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedSchedules.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-8 text-gray-500 italic">
                                                        No hay días de agenda configurados
                                                    </td>
                                                </tr>
                                            ) : (
                                                sortedSchedules.map((schedule, idx) => (
                                                    <tr
                                                        key={schedule.guid}
                                                        className={`border-b ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                                                    >
                                                        <td className="px-4 py-3 text-sm capitalize">
                                                            {schedule.day}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{schedule.time_from}</td>
                                                        <td className="px-4 py-3 text-sm">{schedule.time_to}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 rounded-full bg-brand-purple hover:bg-purple-700 text-white"
                                                                    onClick={() => handleEdit(schedule)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 rounded-full bg-gray-400 hover:bg-gray-500 text-white"
                                                                    onClick={() => handleDelete(schedule)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Formulario de creación/edición */}
                    {selectedEquipment && (
                        <Card className="p-0">
                            <CardHeader className="bg-gray-100 p-4 rounded-t-lg">
                                <CardTitle className="text-base">
                                    {editingSchedule ? "Editar Día de Agenda" : "Nuevo Día de Agenda"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="day" className="text-sm font-medium mb-1 block">Día</Label>
                                        <Select
                                            value={formData.day}
                                            onValueChange={(value) => {
                                                console.log('Día seleccionado:', value);
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

                                    <div className="flex gap-2 justify-end">
                                        {editingSchedule && (
                                            <Button type="button" variant="outline" onClick={resetForm}>
                                                Cancelar
                                            </Button>
                                        )}
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
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Dialog de confirmación de eliminación */}
            <Dialog open={!!scheduleToDelete} onOpenChange={(open) => !open && setScheduleToDelete(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold">
                                    Confirmar Eliminación
                                </DialogTitle>
                                <DialogDescription className="text-sm text-gray-500 mt-1">
                                    Esta acción no se puede deshacer
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-sm text-gray-600">
                            ¿Está seguro que desea eliminar la agenda del día{" "}
                            <span className="font-semibold text-gray-900">
                                {scheduleToDelete && DAYS_MAP[scheduleToDelete.day]}
                            </span>
                            ?
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            Horario:{" "}
                            <span className="font-medium">
                                {scheduleToDelete?.time_from} - {scheduleToDelete?.time_to}
                            </span>
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
