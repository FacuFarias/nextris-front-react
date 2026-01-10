export interface EquipmentSchedule {
    guid: string;
    equipment_id: string;
    equipment_name: string;
    day: string;
    time_from: string;
    time_to: string;
}

export interface EquipmentScheduleFormData {
    equipment_id: string;
    day: string;
    time_from: string;
    time_to: string;
}

export interface EquipmentScheduleResponse {
    success: boolean;
    data: EquipmentSchedule[];
}
