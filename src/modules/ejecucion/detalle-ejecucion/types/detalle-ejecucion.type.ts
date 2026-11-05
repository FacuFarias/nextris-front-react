// Define aquí la estructura de la respuesta del detalle
// Ajusta según lo que devuelva tu API
export type DetalleEjecucion = {
    guid: string;
    study_type: string;
    study_type_id: string | null;
    patient_name: string;
    status: string;
    created_on: string;
    is_reported: boolean;
    study_instance_uid: string;
    history: string;
    clinical_question: string;
    laterality: string;
    stat: boolean;
    number_of_views: number;
    other_details: string;
    flags?: string[];
    tag_ids?: string[];
};


export type DetalleEjecucionResponse = {
    data: DetalleEjecucion;
    success: boolean;
};

export type DetalleEjecucionRequest = {
    history: string;
    clinical_question: string;
    laterality: string;
    stat: boolean;
    number_of_views: number;
    other_details: string;
};

export type StudyType = {
    guid: string;
    description: string;
    code?: string;
    modality?: string;
    bodypart?: string;
}

export type StudyTypeResponse = {
    data: StudyType[];
    success: boolean;
}
