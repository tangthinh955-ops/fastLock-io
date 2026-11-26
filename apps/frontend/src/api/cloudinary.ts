import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  isCloudinaryConfigured,
} from '../config/env';

export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export interface UploadProductImageOptions {
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
}

interface CloudinaryErrorResponse {
  error?: {
    message?: string;
  };
}

/**
 * Kiểm tra định dạng MIME và dung lượng file ảnh sản phẩm trước khi upload.
 * Trả về thông báo lỗi tiếng Việt nếu không hợp lệ, hoặc null nếu hợp lệ.
 */
export function validateProductImageFile(file: File): string | null {
  const isAllowedType = (
    ALLOWED_PRODUCT_IMAGE_TYPES as readonly string[]
  ).includes(file.type);
  if (!isAllowedType) {
    return 'Chỉ hỗ trợ ảnh định dạng JPG, PNG, WEBP hoặc GIF.';
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return 'Dung lượng ảnh tối đa là 5 MB.';
  }

  return null;
}

function isCanceledError(err: unknown): boolean {
  if (axios.isCancel(err)) {
    return true;
  }
  if (err instanceof Error && err.name === 'AbortError') {
    return true;
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'ERR_CANCELED'
  ) {
    return true;
  }
  return false;
}

/**
 * Tải ảnh sản phẩm trực tiếp lên Cloudinary bằng Unsigned Upload Preset.
 * Không dùng apiClient để tránh gửi JWT của backend sang bên thứ ba.
 */
export async function uploadProductImageToCloudinary(
  file: File,
  options?: UploadProductImageOptions,
): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Chưa cấu hình Cloudinary (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).',
    );
  }

  const validationError = validateProductImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
    CLOUDINARY_CLOUD_NAME,
  )}/image/upload`;

  try {
    const res = await axios.post<CloudinaryUploadResponse>(uploadUrl, formData, {
      signal: options?.signal,
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total && event.total > 0) {
          const percent = Math.min(
            100,
            Math.round((event.loaded * 100) / event.total),
          );
          options?.onProgress?.(percent);
        }
      },
    });

    const secureUrl = res.data?.secure_url;
    if (typeof secureUrl !== 'string' || !/^https:\/\//i.test(secureUrl)) {
      throw new Error('Cloudinary không trả về đường dẫn ảnh hợp lệ.');
    }

    return secureUrl;
  } catch (err: unknown) {
    if (isCanceledError(err)) {
      if (err instanceof Error) {
        throw err;
      }
      const abortError = new Error('Đã hủy tải ảnh lên.');
      abortError.name = 'AbortError';
      throw abortError;
    }

    if (axios.isAxiosError<CloudinaryErrorResponse>(err)) {
      const cloudMessage = err.response?.data?.error?.message?.trim();
      if (cloudMessage) {
        throw new Error(`Tải ảnh lên Cloudinary thất bại: ${cloudMessage}`);
      }
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        throw new Error(
          'Quá thời gian tải ảnh lên Cloudinary. Vui lòng thử lại.',
        );
      }
      if (!err.response) {
        throw new Error(
          'Không thể kết nối tới Cloudinary. Vui lòng kiểm tra mạng và thử lại.',
        );
      }
      throw new Error(
        `Tải ảnh lên Cloudinary thất bại (mã lỗi ${err.response.status}). Vui lòng thử lại.`,
      );
    }

    if (err instanceof Error) {
      throw err;
    }

    throw new Error('Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.');
  }
}
