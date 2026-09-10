export interface Patient {
    birthdate: string;
    email?: string;
    gender: string;
    guid: string;
    name: string;
    nationalcode: string;
    patient_type?: string | null;
    patientid: string;
    phone?: string;
    study_count?: number;
    surname: string;
    username?: string | null;
    user_status?: string | null;
}


export interface HistoryPatient {
    guid: string;
    estudio: string;
    medico_autor: string;
    medico_referente: string;
    fecha: string;
    modalidad: string;
    con_imagen: string;
    isreported: number;
    report_available: boolean;
    hidden_in_portal: number;
    studyinstanceuid: string | null;
}

export interface HistoryPatientResponse {
    data: HistoryPatient[];
    success: boolean;
}




