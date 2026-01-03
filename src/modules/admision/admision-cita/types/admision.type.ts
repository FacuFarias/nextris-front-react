export type Admision = {
    guid: string;
    comienzo: string;
    description: string;
    equipo: string;
    fullname: string;
    med_solicitante: string;
    medref: string;
    location: string;
    equipment_name: string;
    modality_id: string;
}


export type AdmisionResponse = {
    data: Admision[];
    success: boolean;
}

