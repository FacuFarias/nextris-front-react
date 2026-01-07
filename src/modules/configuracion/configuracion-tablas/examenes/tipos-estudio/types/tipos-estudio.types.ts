export interface TipoEstudio {
    id: string;
    code: string;
    name: string;
    description: string;
    modalityId: string;
    modalityName?: string;
    duration: number; // en minutos
    price: number;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
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
