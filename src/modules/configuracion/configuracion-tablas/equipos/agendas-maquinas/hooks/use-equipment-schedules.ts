import { useQuery } from "@tanstack/react-query";
import { equipmentScheduleService } from "../services/equipment-schedules.service";

export const useEquipmentSchedules = (equipmentId: string | undefined) => {
    return useQuery({
        queryKey: ["equipment-schedules", equipmentId],
        queryFn: () => equipmentScheduleService.getSchedulesByEquipment(equipmentId!),
        enabled: !!equipmentId,
    });
};
