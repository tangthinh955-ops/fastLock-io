const DEV_DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const CORS_ALLOWED_METHODS = [
  'GET',
  'HEAD',
  'PUT',
  'PATCH',
  'POST',
  'DELETE',
  'OPTIONS',
];

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

export interface AppCorsOptions {
  origin: (requestOrigin: string | undefined, callback: CorsOriginCallback) => void;
  methods: string[];
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '').toLowerCase();
}

/**
 * Tách và chuẩn hóa danh sách CORS_ORIGINS; mặc định mở localhost Vite khi chạy dev.
 */
export function parseCorsOrigins(
  rawOrigins?: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string[] {
  const configured = (rawOrigins ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return nodeEnv === 'production' ? [] : [...DEV_DEFAULT_ORIGINS];
}

/**
 * Kiểm tra Origin trình duyệt; request không gửi Origin (curl, health-check, CLI) được phép đi qua.
 */
export function isOriginAllowed(
  requestOrigin: string | undefined,
  allowedOrigins: readonly string[],
): boolean {
  if (!requestOrigin) {
    return true;
  }

  return allowedOrigins.includes(normalizeOrigin(requestOrigin));
}

/**
 * Kiểm tra đã khai báo ít nhất một origin hợp lệ trong CORS_ORIGINS hay chưa.
 */
export function hasConfiguredCorsOrigins(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env.CORS_ORIGINS ?? '')
    .split(',')
    .map(normalizeOrigin)
    .some(Boolean);
}

/**
 * Tạo cấu hình CORS dùng callback động để đọc CORS_ORIGINS tại lúc request/handshake.
 */
export function createCorsOptions(): AppCorsOptions {
  return {
    origin: (requestOrigin, callback) => {
      const allowedOrigins = parseCorsOrigins(
        process.env.CORS_ORIGINS,
        process.env.NODE_ENV,
      );
      callback(null, isOriginAllowed(requestOrigin, allowedOrigins));
    },
    methods: CORS_ALLOWED_METHODS,
  };
}

/**
 * Chỉ cho phép tự kill port khi chạy local dev, tuyệt đối tắt trên production/Render.
 */
export function shouldAutoKillPort(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV !== 'production' && env.RENDER !== 'true';
}

