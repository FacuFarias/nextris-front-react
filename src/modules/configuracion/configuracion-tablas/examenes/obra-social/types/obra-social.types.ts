
export interface ObraSocial {
    guid: string;
    description: string;
    isactive: number;
    externalcode: string | null;
    headerdescription: string | null;
}

export interface ObraSocialFormData {
    description: string;
    externalcode?: string;
    headerdescription?: string;
}

export interface obraSocialResponse {
    success: boolean;
    data: ObraSocial[]
}