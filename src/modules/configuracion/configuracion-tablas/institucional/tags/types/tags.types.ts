export interface Tag {
  guid: string;
  facility_id: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagsResponse {
  success: boolean;
  data: Tag[];
}

export interface TagFormData {
  facility_id: string;
  description: string;
  is_active: boolean;
}
