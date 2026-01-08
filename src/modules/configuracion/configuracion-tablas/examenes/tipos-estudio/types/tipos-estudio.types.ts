export interface TipoEstudio {
    guid: string;
    description: string;
}

export interface TipoEstudioFormData {
    code: string;
    name: string;
    description: string;
    modalityId: string;
    duration: number;
    price: number;
    status: 'active' | 'inactive';
}

export interface TipoEstudioResponse {
    success: boolean;
    data: TipoEstudio;
}

