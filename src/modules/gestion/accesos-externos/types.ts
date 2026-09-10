export type SharedAccessType = "case_link" | "image_share";
export type SharedAccessStatus = "all" | "active" | "active_or_revoked" | "expired" | "revoked";

export interface SharedAccessLink {
    guid: string;
    type: SharedAccessType;
    short_code: string | null;
    public_url: string | null;
    study_iuid: string;
    patient_name: string | null;
    patient_id: string | null;
    accession_number: string | null;
    study_description: string | null;
    created_at: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    open_count: number;
    last_opened_at: string | null;
    status: Exclude<SharedAccessStatus, "all">;
}

export interface SharedAccessLinksResponse {
    success: boolean;
    data: {
        items: SharedAccessLink[];
        page: number;
        per_page: number;
        total: number;
        pages: number;
    };
}
