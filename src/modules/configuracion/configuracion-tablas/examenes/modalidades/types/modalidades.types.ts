export interface Modalidad {
    guid: string;
    description: string;
    externalcode: string;
}

export interface ModalidadFormData {
    code: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
}

export interface ModalidadesResponse {
    success: boolean;
    data: Modalidad[];
}
