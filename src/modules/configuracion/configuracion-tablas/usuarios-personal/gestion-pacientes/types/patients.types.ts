export interface Patient {
    guid: string;
    username: string;
    name: string;
    surname: string;
    national_number: string | null;
    email: string | null;
    phone: string | null;
    birth_date: string | null;
    gender: 'M' | 'F' | 'O' | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
}

export interface PatientFormData {
    name: string;
    surname: string;
    national_number?: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    gender?: 'M' | 'F' | 'O';
    address?: string;
    is_active?: boolean;
}

export interface PatientResponse {
    success: boolean;
    data: Patient[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
}

export interface PatientListParams {
    page: number;
    per_page: number;
    include_inactive?: boolean;
    column_filters: Record<string, string>;
    sort_column: string;
    sort_direction: 'asc' | 'desc';
}
