import type {
  CreateCampaignRequest,
  CampaignResponse,
  CreateBannerRequest,
  BannerResponse,
  GeneratePresignedUrlRequest,
  PresignedUrlResponse,
  BatchUpsertAudienceResponse,
  DestinationScreen,
  ErrorResponse,
  PaginationBannerResponse,
  UpdateBannerRequest,
} from "../types/banner";

const API_BASE_URL = (
  import.meta.env.VITE_FORCE_PROXY === '1' || import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || 'https://ifp-banners-manager.aws.cluster-01.k8s.movilepay-sandbox.dc-ifood.com')
);
const REQUESTER_TOKEN_HEADER = "x-requester-token";

function getRequesterToken(): string | null {
  // 1. Check URL parameters
  try {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get(REQUESTER_TOKEN_HEADER) || params.get("token");
    if (urlToken) {
      try { sessionStorage.setItem(REQUESTER_TOKEN_HEADER, urlToken); } catch {}
      return urlToken;
    }
  } catch {}

  // 2. Check window global variable
  try {
    const w: any = window as any;
    if (w && typeof w.__REQUESTER_TOKEN__ === "string" && w.__REQUESTER_TOKEN__) {
      return w.__REQUESTER_TOKEN__ as string;
    }
  } catch {}

  // 3. Check sessionStorage
  try {
    const s = sessionStorage.getItem(REQUESTER_TOKEN_HEADER);
    if (s) return s;
  } catch {}

  // 4. Check localStorage
  try {
    const l = localStorage.getItem(REQUESTER_TOKEN_HEADER);
    if (l) return l;
  } catch {}

  // 5. Check cookies
  try {
    const match = document.cookie.match(new RegExp("(?:^|; )" + REQUESTER_TOKEN_HEADER + "=([^;]*)"));
    if (match) return decodeURIComponent(match[1]);
  } catch {}

  // 6. Fallback to environment variable (for local development)
  try {
    const envToken = import.meta.env.VITE_REQUESTER_TOKEN;
    if (envToken && envToken !== 'your-token-here') {
      return envToken;
    }
  } catch {}

  return null;
}

function jsonHeaders(extra?: HeadersInit): HeadersInit {
  const token = getRequesterToken();
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (token) base[REQUESTER_TOKEN_HEADER] = token;
  return { ...base, ...(extra as object) };
}

function authOnlyHeaders(): HeadersInit | undefined {
  const token = getRequesterToken();
  if (!token) return undefined;
  return { [REQUESTER_TOKEN_HEADER]: token } as HeadersInit;
}

// Helper function to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
      timestamp: new Date().toISOString(),
    }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// Generate presigned URL for S3 upload
export async function generatePresignedUrl(
  key: string,
  contentType: "image/png" | "image/jpeg",
  expirationSeconds: number = 300
): Promise<PresignedUrlResponse> {
  const requestBody: GeneratePresignedUrlRequest = {
    key,
    expiration_seconds: expirationSeconds,
    content_type: contentType,
  };

  const response = await fetch(`${API_BASE_URL}/v1/s3/presigned-url`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(requestBody),
  });

  return handleResponse<PresignedUrlResponse>(response);
}

// Upload image to S3 using presigned URL
export async function uploadImageToS3(presignedUrl: string, file: File): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }
}

// Complete image upload flow
export async function uploadImage(file: File): Promise<string> {
  // Generate a unique key for the file
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const key = `banners/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

  // Determine content type
  const contentType = file.type as "image/png" | "image/jpeg";

  // Get presigned URL
  const { url: presignedUrl } = await generatePresignedUrl(key, contentType);

  // Upload to S3
  await uploadImageToS3(presignedUrl, file);

  // Return the public URL (remove query parameters from presigned URL)
  const publicUrl = presignedUrl.split('?')[0];
  return publicUrl;
}

// Create a new campaign
export async function createCampaign(data: CreateCampaignRequest): Promise<CampaignResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/campaigns`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<CampaignResponse>(response);
}

// Create a new banner for a campaign
export async function createBanner(
  campaignId: string,
  data: CreateBannerRequest
): Promise<BannerResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/campaigns/${campaignId}/banner`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<BannerResponse>(response);
}

// Import audience batch from CSV file
export async function importAudienceBatch(
  campaignId: string,
  file: File
): Promise<BatchUpsertAudienceResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/v1/audiences/${campaignId}/batch-import`, {
    method: "POST",
    headers: authOnlyHeaders(),
    body: formData,
  });

  return handleResponse<BatchUpsertAudienceResponse>(response);
}

// Get all destination screens
export async function getDestinationScreens(): Promise<DestinationScreen[]> {
  const response = await fetch(`${API_BASE_URL}/v1/destination-screens`, {
    method: "GET",
    headers: jsonHeaders(),
  });

  return handleResponse<DestinationScreen[]>(response);
}

// Get all banners with pagination
export async function getAllBanners(page: number = 1, size: number = 10): Promise<PaginationBannerResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/banners?page=${page}&size=${size}`, {
    method: "GET",
    headers: jsonHeaders(),
  });

  return handleResponse<PaginationBannerResponse>(response);
}

// Get banner by ID
export async function getBannerById(id: string): Promise<BannerResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/banners/${id}`, {
    method: "GET",
    headers: jsonHeaders(),
  });

  return handleResponse<BannerResponse>(response);
}

// Update banner
export async function updateBanner(
  campaignId: string,
  bannerId: string,
  data: UpdateBannerRequest
): Promise<BannerResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/campaigns/${campaignId}/banner/${bannerId}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<BannerResponse>(response);
}

// Approve banner
export async function approveBanner(campaignId: string, bannerId: string): Promise<BannerResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/campaigns/${campaignId}/banner/${bannerId}/approve`, {
    method: "PUT",
    headers: jsonHeaders(),
  });

  return handleResponse<BannerResponse>(response);
}

// Reject banner
export async function rejectBanner(campaignId: string, bannerId: string): Promise<BannerResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/campaigns/${campaignId}/banner/${bannerId}/reject`, {
    method: "PUT",
    headers: jsonHeaders(),
  });

  return handleResponse<BannerResponse>(response);
}
