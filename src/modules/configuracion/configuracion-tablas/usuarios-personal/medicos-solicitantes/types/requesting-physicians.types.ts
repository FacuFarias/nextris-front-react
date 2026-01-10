export interface RequestingPhysician {
    guid: string;
    description: string;
    phone: string | null;
    mail: string | null;
    note: string | null;
    location_id: string | null;
    location_name: string | null;
}

export interface RequestingPhysicianFormData {
    description: string;
    phone?: string;
    mail?: string;
    note?: string;
    location_id?: string;
}

export interface RequestingPhysicianResponse {
    success: boolean;
    data: RequestingPhysician[];
}
