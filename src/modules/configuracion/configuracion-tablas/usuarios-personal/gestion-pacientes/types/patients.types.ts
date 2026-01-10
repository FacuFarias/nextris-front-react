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
}
