export interface BodyPart {
    guid: string;
    description: string;
}

export interface BodyPartsResponse {
    success: boolean;
    data: BodyPart[];
}

export interface BodyPartFormData {
    description: string;
}
