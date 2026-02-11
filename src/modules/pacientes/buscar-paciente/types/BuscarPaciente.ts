export interface Patient {
    birthdate: string;
    email?: string;
    gender: string;
    guid: string;
    name: string;
    nationalcode: string;
    patientid: string;
    phone?: string;
    study_count?: number;
    surname: string;
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
    pdf_path: string | null;
}

export interface HistoryPatientResponse {
    data: HistoryPatient[];
    success: boolean;
}




