


export interface ReasignacionExamenes {
    guid: string;
    createdon: string;
    localacc: string;
    patientid: string;
    patient_name: string;
    birthdate: string;
    study_description: string;
    status: string;
}

export interface ReasignacionExamenesResponse {
    success: boolean;
    data: ReasignacionExamenes[];
}

export interface ReasignacionExamenesPacientes {
    guid: string;
    name: string;
    surname: string;
    nationalcode: string;
    gender: string;
    birthdate: string;
    phone: string;
    email: string;
    healthcard: string;
}

export interface ReasignacionExamenesPacientesResponse {
    success: boolean;
    data: ReasignacionExamenesPacientes[];
}


