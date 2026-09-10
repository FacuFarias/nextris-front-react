export interface Location {
    guid: string;
    description: string;
    facility_id: string;
    facility_name: string;
    code?: string;
    status: 'Active' | 'Inactive' | 'active' | 'inactive' | string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
    name: string;
    email?: string;
    mail?: string;
    timezone: string;
    logo_path?: string;
    created_at: string;
    updated_at: string;
    // Transmisión DICOM
    gateway_aet?: string;
    gateway_ip?: string;
    transmission_type?: 'Manual' | 'Automatic';
    retention_days?: number;
}


export interface LocationsResponse {
    success: boolean;
    data: Location[];
}

export interface LocationFormData {
    description: string;
    facility_id: string;
    code?: string;
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
    logo?: File;
    logo_path?: string;
    // Transmisión DICOM
    gateway_aet?: string;
    gateway_ip?: string;
    transmission_type?: 'Manual' | 'Automatic';
    retention_days?: number;
}
