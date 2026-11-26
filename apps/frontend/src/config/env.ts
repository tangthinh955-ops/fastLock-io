const DEFAULT_BACKEND_URL = 'http://localhost:3001';

export interface FrontendEnvInput {
  VITE_API_URL?: string;
  VITE_SOCKET_URL?: string;
  VITE_CLOUDINARY_CLOUD_NAME?: string;
  VITE_CLOUDINARY_UPLOAD_PRESET?: string;
}

/**
 * Chuẩn hóa base URL từ biến môi trường: bỏ khoảng trắng và dấu '/' cuối.
 */
export function normalizeBaseUrl(raw?: string): string | undefined {
  const trimmed = raw?.trim().replace(/\/+$/, '');
  return trimmed ? trimmed : undefined;
}

/**
 * Suy ra URL API và Socket.io từ env; SOCKET_URL ưu tiên VITE_SOCKET_URL rồi fallback API_URL.
 */
export function resolveEnvUrls(env: FrontendEnvInput): {
  apiUrl: string;
  socketUrl: string;
} {
  const apiUrl = normalizeBaseUrl(env.VITE_API_URL) ?? DEFAULT_BACKEND_URL;
  const socketUrl = normalizeBaseUrl(env.VITE_SOCKET_URL) ?? apiUrl;
  return { apiUrl, socketUrl };
}

const runtimeEnv: FrontendEnvInput =
  (import.meta as ImportMeta & { env?: FrontendEnvInput }).env ?? {};

export const { apiUrl: API_URL, socketUrl: SOCKET_URL } =
  resolveEnvUrls(runtimeEnv);

export const CLOUDINARY_CLOUD_NAME =
  runtimeEnv.VITE_CLOUDINARY_CLOUD_NAME?.trim() ?? '';

export const CLOUDINARY_UPLOAD_PRESET =
  runtimeEnv.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() ?? '';

export const isCloudinaryConfigured: boolean = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET,
);

