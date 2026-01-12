export interface Equipment {
    guid: string;
    description: string;
    modality: string;
    aetitle: string | null;
    ip: string | null;
}

export interface EquipmentSchedule {
    guid: string;
    day: string; // "lunes", "martes", etc.
    time_from: string; // formato HH:MM
    time_to: string; // formato HH:MM
}

export interface EquipmentScheduleFormData {
    day: string;
    time_from: string;
    time_to: string;
}

export interface EquipmentSchedulePayload {
    day: number; // 0-6 para enviar al backend
    time_from: string;
    time_to: string;
}

export interface EquipmentResponse {
    success: boolean;
    data: Equipment[];
}

export interface EquipmentScheduleResponse {
    success: boolean;
    data: EquipmentSchedule[];
}
