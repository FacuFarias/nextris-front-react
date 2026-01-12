import { useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentScheduleService } from "../services/equipment-schedules.service";
import { toast } from "sonner";

export const useDeleteEquipmentSchedule = (equipmentId: string | undefined) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (scheduleId: string) =>
            equipmentScheduleService.delete(equipmentId!, scheduleId),
        onSuccess: () => {
            toast.success("Agenda eliminada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["equipment-schedules", equipmentId] });
        },
        onError: () => {
            toast.error("Error al eliminar la agenda");
        },
    });
};
