export interface TipoEstudio {
    guid: string;
    code: string;
    description: string;
    studygroup: string;        // Nombre del grupo de estudio
    studygroup_id?: string;    // ID del grupo de estudio (para editar)
    bodypart: string;          // Nombre de la parte del cuerpo
    bodypart_id?: string;      // ID de la parte del cuerpo (para editar)
    modality: string;          // Nombre de la modalidad
    modality_id?: string;      // ID de la modalidad (para editar)
    rvu: number;
    nofviews: number;
}

export interface TipoEstudioFormData {
    code: string;              // requerido
    description: string;       // requerido
    studygroup_id: string;     // requerido - UUID del grupo de estudio
    bodypart_id: string;       // requerido - UUID de la parte del cuerpo
    modality_id: string;       // requerido - UUID de la modalidad
    rvu?: number;              // opcional - Unidades de Valor Relativo
    nofviews?: number;         // opcional - Número de vistas
}

export interface TipoEstudioResponse {
    success: boolean;
    data: TipoEstudio;
}


