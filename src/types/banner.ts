// Types for Banner API

export type BannerPlacement =
  | "HOME_SCREEN_TOP_BANNERS"
  | "HOME_SCREEN_MIDDLE_BANNERS"
  | "ALL_PRODUCTS_SCREEN_BOTTOM_BANNERS";

export type BannerProduct =
  | "CREDIT"
  | "ANTICIPATION"
  | "CREDIT_CARD"
  | "ASSURANCE";

export type BannerStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "REJECTED";

export type CampaignStatus = "ACTIVE" | "INACTIVE";

export type Platform = "ANDROID" | "IOS";

export interface DestinationScreen {
  id: string;
  name: string;
  action_identifier: string;
  action_content?: string;
  is_active: boolean;
  platforms: {
    id: string;
    platform_name: Platform;
    min_version: string;
  }[];
}

export interface CreateCampaignRequest {
  description: string;
  status: CampaignStatus;
  partner_external_id?: string;
  is_public: boolean;
  created_by?: string;
}

export interface CampaignResponse {
  id: string;
  description: string;
  status: CampaignStatus;
  partner_external_id?: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  created_by?: string;
}

export interface CreateBannerRequest {
  placement: BannerPlacement;
  banner_identifier: string;
  image_url: string;
  start_date: string;
  end_date?: string;
  priority: number;
  subtitle?: string;
  description?: string;
  action_identifier?: string;
  action_content?: string;
  product: BannerProduct;
  created_by?: string;
  destination_screen_id?: string;
  is_end_date_valid: boolean;
}

export interface BannerResponse {
  id: string;
  campaign_id: string;
  placement: BannerPlacement;
  banner_identifier: string;
  image_url: string;
  start_date: string;
  end_date?: string;
  priority: number;
  status: BannerStatus;
  subtitle?: string;
  description?: string;
  action_identifier?: string;
  action_content?: string;
  product: BannerProduct;
  created_at: string;
  updated_at: string;
  created_by?: string;
  destination_screen_id?: string;
}

export interface GeneratePresignedUrlRequest {
  key: string;
  expiration_seconds: number;
  content_type: "image/png" | "image/jpeg";
}

export interface PresignedUrlResponse {
  url: string;
  expires_at: string;
}

export interface BatchUpsertAudienceResponse {
  total_processed: number;
  validation_errors: {
    line_number: number;
    content: string;
    error: string;
  }[];
}

export interface UpdateBannerRequest {
  image_url: string;
  start_date: string;
  end_date?: string;
  priority: number;
  status: string;
  subtitle: string;
  description: string;
  action_identifier?: string;
  action_content?: string;
  product: string;
  destination_screen_id?: string;
  is_end_date_valid: boolean;
}

export interface PaginationBannerResponse {
  page_size: number;
  page: number;
  total_items: number;
  data: BannerResponse[];
}

export interface ErrorResponse {
  message: string;
  error_code?: string;
  timestamp: string;
  route?: string;
  http_method?: string;
  http_status?: string;
  correlation_id?: string;
  trace_id?: string;
  location?: string;
}
