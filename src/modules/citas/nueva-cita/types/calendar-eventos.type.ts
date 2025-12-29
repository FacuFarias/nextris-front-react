export interface CalendarEvent {
    guid: string | number;
    title?: string;
    start: string; 
    end: string;
    editable: boolean;
    exam?: string;
    [key: string]: any;
}

export interface WorkHour {
    day: number;
    start: string;
    end: string;
}

export interface CalendarEventosResponse {
    data: {
        events: CalendarEvent[];
        timezone: string;
        work_hours: WorkHour[];
    };
    success: boolean;
}
