export interface Location {
    guid: string;
    description: string;
    facility_id: string;
    facility_name: string;
    status: 'active' | 'inactive';
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
    email: string;
    timezone: string;
    created_at: string;
    updated_at: string;
}


export interface LocationsResponse {
    success: boolean;
    data: Location[];
}

export interface LocationFormData {
    description: string;
    facility_id: string;
    status?: 'Active' | 'Inactive';
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    name?: string;
    phone?: string;
    email?: string;
    timezone?: string;
}
