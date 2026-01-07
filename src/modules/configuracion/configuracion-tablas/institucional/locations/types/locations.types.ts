export interface Location {
    guid: string;
    name: string;
    code: string;
    is_default: boolean;
}
export interface LocationsResponse {
    success: boolean;
    data: Location[];
}
export interface LocationFormData {
    name: string;
    code: string;
    facilityId: string;
    type: string;
    status: 'active' | 'inactive';
}
