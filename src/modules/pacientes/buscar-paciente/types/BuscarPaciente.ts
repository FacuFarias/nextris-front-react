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


export type { CombinedHistoryEntry as HistoryPatient, CombinedHistoryResponse as HistoryPatientResponse } from '@/types/patientHistory';
