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

export interface ObraSocialResponse {
    success: boolean;
    data: ObraSocial[];
}

export interface InsuranceLocation {
    guid: string;
    insurance_id: string;
    location_id: string;
    location_name: string;
}

export interface InsuranceLocationsResponse {
    success: boolean;
    data: InsuranceLocation[];
}
