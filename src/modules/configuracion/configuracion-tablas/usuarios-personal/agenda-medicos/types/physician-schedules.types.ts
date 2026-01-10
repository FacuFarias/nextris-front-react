export interface PhysicianSchedule {
    guid: string;
    physician_id: string;
    physician_name: string;
    day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
    time_from: string;
    time_to: string;
    init_day: string | null;
    finish_day: string | null;
    location_id: string | null;
    location_name: string | null;
}

export interface PhysicianScheduleFormData {
    physician_id: string;
    day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
    time_from: string;
    time_to: string;
    init_day?: string;
    finish_day?: string;
    location_id?: string;
}

export interface PhysicianScheduleResponse {
    success: boolean;
    data: PhysicianSchedule[];
}
