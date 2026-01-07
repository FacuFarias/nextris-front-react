export interface Facility {
    id: string;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface FacilityFormData {
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive';
}

export interface FacilityFilters {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
}
