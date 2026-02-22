export type Ejecucion = {
    guid: string;
    created_on: string;
    patient_surname: string;
    patient_name: string;
    study_type: string;
    status: string;
    equipment: string;
    admission_number: string;
    accession_number: string;
    flags?: string[];
    tag_ids?: string[];
}

export type EjecucionResponse = {
    data: Ejecucion[];
    success: boolean;
}

