export interface FacilityModule {
  module_guid: string;
  module_code: string;
  module_name: string;
  module_description?: string;
  module_active: boolean;
  relation_guid?: string | null;
  is_active: boolean;
}

export interface FacilityModulesResponse {
  success: boolean;
  data: FacilityModule[];
}

export interface SyncFacilityModulesPayload {
  module_codes: string[];
  current_password: string;
  reason?: string;
}

export interface FacilityModuleChangeLog {
  guid: string;
  module_code: string;
  action: 'enabled' | 'disabled';
  previous_is_active: boolean;
  new_is_active: boolean;
  changed_by_user_id?: string | null;
  changed_by_username?: string | null;
  changed_at?: string | null;
  reason?: string | null;
  request_ip?: string | null;
  prev_hash?: string | null;
  row_hash?: string | null;
}

export interface FacilityModuleChangeLogsResponse {
  success: boolean;
  data: FacilityModuleChangeLog[];
}
