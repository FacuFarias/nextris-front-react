export interface GruposEstudio {
    guid: string;
    description: string;
}

export interface GruposEstudioResponse {
    success: boolean;
    data: GruposEstudio[];
}

export interface GruposEstudioFormData {
    description: string;
}
