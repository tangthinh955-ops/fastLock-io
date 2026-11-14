import {
  createCorsOptions,
  hasConfiguredCorsOrigins,
  isOriginAllowed,
  parseCorsOrigins,
  shouldAutoKillPort,
} from './cors.config';

describe('cors.config', () => {
  const originalCorsOrigins = process.env.CORS_ORIGINS;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalRender = process.env.RENDER;

  afterEach(() => {
    if (originalCorsOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = originalCorsOrigins;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalRender === undefined) {
      delete process.env.RENDER;
    } else {
      process.env.RENDER = originalRender;
    }
  });

  describe('parseCorsOrigins', () => {
    it('normalizes whitespace, trailing slashes, casing, and skips empty items', () => {
      expect(
        parseCorsOrigins(
          ' https://LiveOrder-Six.vercel.app/ , , http://localhost:5173/// ',
          'production',
        ),
      ).toEqual(['https://liveorder-six.vercel.app', 'http://localhost:5173']);
    });

    it('falls back to Vite local dev origins when unset outside production', () => {
      expect(parseCorsOrigins(undefined, 'development')).toEqual([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ]);
      expect(parseCorsOrigins('   ', 'test')).toEqual([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ]);
    });

    it('returns an empty allowlist when unset in production (fail-closed)', () => {
      expect(parseCorsOrigins(undefined, 'production')).toEqual([]);
      expect(parseCorsOrigins(' , ', 'production')).toEqual([]);
    });
  });

  describe('isOriginAllowed', () => {
    it('allows requests with no Origin header (health checks, curl, CLI clients)', () => {
      expect(isOriginAllowed(undefined, [])).toBe(true);
    });

    it('matches normalized origins and blocks unlisted origins', () => {
      const allowed = ['https://liveorder-six.vercel.app'];
      expect(
        isOriginAllowed('HTTPS://LiveOrder-Six.vercel.app/', allowed),
      ).toBe(true);
      expect(isOriginAllowed('https://evil.example', allowed)).toBe(false);
    });
  });

  describe('hasConfiguredCorsOrigins', () => {
    it('detects whether at least one explicit origin is configured', () => {
      expect(hasConfiguredCorsOrigins({ NODE_ENV: 'production' })).toBe(false);
      expect(
        hasConfiguredCorsOrigins({
          NODE_ENV: 'production',
          CORS_ORIGINS: ' ,  ',
        }),
      ).toBe(false);
      expect(
        hasConfiguredCorsOrigins({
          NODE_ENV: 'production',
          CORS_ORIGINS: 'https://liveorder-six.vercel.app',
        }),
      ).toBe(true);
    });
  });

  describe('createCorsOptions', () => {
    const checkOrigin = (
      options: ReturnType<typeof createCorsOptions>,
      requestOrigin: string | undefined,
    ) =>
      new Promise<{ error: Error | null; allow: boolean | undefined }>(
        (resolve) => {
          options.origin(requestOrigin, (error, allow) => {
            resolve({ error, allow });
          });
        },
      );

    it('evaluates CORS_ORIGINS dynamically on each request after env changes', async () => {
      delete process.env.CORS_ORIGINS;
      process.env.NODE_ENV = 'production';
      const options = createCorsOptions();

      expect(await checkOrigin(options, 'https://liveorder-six.vercel.app')).toEqual({
        error: null,
        allow: false,
      });

      process.env.CORS_ORIGINS = 'https://liveorder-six.vercel.app/';

      expect(await checkOrigin(options, 'https://liveorder-six.vercel.app')).toEqual({
        error: null,
        allow: true,
      });
      expect(await checkOrigin(options, undefined)).toEqual({
        error: null,
        allow: true,
      });
      expect(await checkOrigin(options, 'https://evil.example')).toEqual({
        error: null,
        allow: false,
      });
    });
  });

  describe('shouldAutoKillPort', () => {
    it('enables killPort only outside production and Render', () => {
      expect(shouldAutoKillPort({ NODE_ENV: 'development' })).toBe(true);
      expect(shouldAutoKillPort({})).toBe(true);
      expect(shouldAutoKillPort({ NODE_ENV: 'production' })).toBe(false);
      expect(
        shouldAutoKillPort({ NODE_ENV: 'development', RENDER: 'true' }),
      ).toBe(false);
    });
  });
});

