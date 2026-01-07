export interface Modalidad {
    id: string;
    code: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface ModalidadFormData {
    code: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
}
