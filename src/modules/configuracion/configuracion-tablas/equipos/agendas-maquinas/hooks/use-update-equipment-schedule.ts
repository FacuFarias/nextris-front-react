import { useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentScheduleService } from "../services/equipment-schedules.service";
import type { EquipmentScheduleFormData } from "../types/equipment-schedules.types";
import { toast } from "sonner";

interface UpdateEquipmentScheduleParams {
    scheduleId: string;
    formData: Partial<EquipmentScheduleFormData>;
}

export const useUpdateEquipmentSchedule = (equipmentId: string | undefined) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ scheduleId, formData }: UpdateEquipmentScheduleParams) =>
            equipmentScheduleService.update(equipmentId!, scheduleId, formData),
        onSuccess: () => {
            toast.success("Agenda actualizada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["equipment-schedules", equipmentId] });
        },
        onError: () => {
            toast.error("Error al actualizar la agenda");
        },
    });
};
