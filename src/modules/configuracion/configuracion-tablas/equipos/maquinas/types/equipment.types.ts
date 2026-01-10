export interface Equipment {
    guid: string;
    description: string;
    modality_id: string;
    modality: string;
    location_id: string | null;
    location_name: string | null;
    aeTitle: string | null;
    ip: string | null;
    port: number | null;
    status: 'active' | 'inactive';
}

export interface EquipmentFormData {
    description: string;
    modality_id: string;
    location_id?: string;
    aetitle?: string;
    ip?: string;
    port?: number;
    status?: 'active' | 'inactive';
}

export interface EquipmentResponse {
    success: boolean;
    data: Equipment[];
}
