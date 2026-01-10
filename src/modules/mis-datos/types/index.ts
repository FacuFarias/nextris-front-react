export interface PatientProfile {
    patient_id: string;
    username: string;
    account_status: "Active" | "Inactive";
    last_login: string;
    name: string;
    surname: string;
    full_name: string;
    national_code: string;
    patient_id_number: string;
    birthdate: string;
    age: number;
    sex_code: "M" | "F" | "O";
    sex: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    health_card: string;
}

export interface PatientProfileResponse {
    success: boolean;
    data: PatientProfile;
}

export interface UpdateProfilePayload {
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
}
