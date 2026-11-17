export type StatusLevel = "green" | "yellow" | "red";

export interface StorageCount {
    objects: number;
    bytes: number;
}

export interface StorageOverview {
    generated_at: string;
    disk: { path: string; total: number; used: number; free: number; threshold: number; margin: number };
    local_cache: { fs1: StorageCount; retrieve: StorageCount; bytes: number; studies: number };
    b2: StorageCount & { source: "catalog"; studies: number };
    pending_b2: StorageCount & { oldest_age_seconds: number | null };
    today: { date: string; studies: number; bytes: number };
    study_size: {
        studies: number;
        total_bytes: number;
        largest_bytes: number;
        average_bytes: number;
        recent_days: number;
        recent_studies: number;
        recent_bytes: number;
        recent_average_bytes: number;
    };
    projection: {
        window_days: number;
        bytes_per_day: number;
        studies_per_day: number;
        days_to_threshold: number | null;
        days_to_full: number | null;
    };
    status: { level: StatusLevel; reasons: string[] };
}

export interface DailyPoint {
    date: string;
    studies: number;
    bytes: number;
    cumulative_studies: number;
    cumulative_bytes: number;
}

export interface DiskSnapshot {
    taken_at: string;
    disk_total: number;
    disk_free: number;
    local_bytes: number;
    b2_bytes: number;
    pending_b2_bytes: number;
}

export interface StorageHistory {
    days: number;
    daily: DailyPoint[];
    snapshots: DiskSnapshot[];
    threshold: number;
}

export interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface CacheCopy extends StorageCount {
    storage: "fs1" | "fs1-retrieve";
    instances: number;
    all_backed_up: boolean;
    entered_at: string;
    expires_at: string;
    ttl_seconds: number;
    expired: boolean;
    can_remove: boolean;
    blocked_reason: string | null;
    queue_status: "queued" | "failed" | null;
}

export interface CacheStudy {
    study_pk: number;
    study_uid: string;
    study_date: string;
    study_time: string;
    description: string;
    accession: string;
    patient_name: string;
    copies: CacheCopy[];
}

export interface CacheStudies {
    items: CacheStudy[];
    total: number;
    page: number;
    per_page: number;
    timezone: string;
    policy_enabled: boolean;
    poll_seconds: number;
    generated_at: string;
}
