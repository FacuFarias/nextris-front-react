import { useMutation, useQueryClient } from "@tanstack/react-query";
import { equipmentScheduleService } from "../services/equipment-schedules.service";
import type { EquipmentScheduleFormData } from "../types/equipment-schedules.types";
import { toast } from "sonner";

export const useCreateEquipmentSchedule = (equipmentId: string | undefined) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: EquipmentScheduleFormData) =>
            equipmentScheduleService.create(equipmentId!, data),
        onSuccess: () => {
            toast.success("Agenda creada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["equipment-schedules", equipmentId] });
        },
        onError: () => {
            toast.error("Error al crear la agenda");
        },
    });
};
