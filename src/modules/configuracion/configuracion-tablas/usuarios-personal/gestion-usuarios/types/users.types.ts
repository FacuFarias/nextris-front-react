export interface User {
    guid: string;
    username: string;
    role: string;
    role_id: string;
    name: string;
    surname: string;
    national_number: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
}

export interface UserFormData {
    username: string;
    password?: string;
    role_id: string;
    name: string;
    surname: string;
    national_number?: string;
    email?: string;
    phone?: string;
    is_active?: boolean;
}

export interface UserResponse {
    success: boolean;
    data: User[];
}

export interface Role {
    guid: string;
    description: string;
}

export interface RolesResponse {
    success: boolean;
    data: Role[];
}
