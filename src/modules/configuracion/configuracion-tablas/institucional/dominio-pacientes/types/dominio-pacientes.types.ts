export interface DominioPaciente {
    guid: string;
    description: string;
    isactive: number;
    externalcode: string | null;
}

export interface DominioPacienteFormData {
    description: string;
    externalcode?: string;
}

export interface DominioPacienteResponse {
    success: boolean;
    data: DominioPaciente[];
}
