import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, sanitizeObject, isSensitiveKey, truncateId } from './logger';

describe('logger - isSensitiveKey', () => {
  it('flags exact sensitive key names', () => {
    expect(isSensitiveKey('password')).toBe(true);
    expect(isSensitiveKey('accessToken')).toBe(true);
    expect(isSensitiveKey('refreshToken')).toBe(true);
    expect(isSensitiveKey('apiKey')).toBe(true);
  });

  it('flags keys matching sensitive patterns case-insensitively', () => {
    expect(isSensitiveKey('userPassword')).toBe(true);
    expect(isSensitiveKey('AUTH_TOKEN')).toBe(true);
    expect(isSensitiveKey('mySecretValue')).toBe(true);
    expect(isSensitiveKey('Authorization')).toBe(true);
  });

  it('does not flag non-sensitive keys', () => {
    expect(isSensitiveKey('username')).toBe(false);
    expect(isSensitiveKey('email')).toBe(false);
    expect(isSensitiveKey('count')).toBe(false);
  });
});

describe('logger - sanitizeObject', () => {
  it('redacts values of sensitive keys', () => {
    const result = sanitizeObject({
      username: 'jane',
      password: 'supersecret123',
    }) as Record<string, unknown>;
    expect(result.username).toBe('jane');
    expect(result.password).not.toBe('supersecret123');
    expect(String(result.password)).toContain('REDACTED');
  });

  it('partially redacts email addresses', () => {
    const result = sanitizeObject('jane.doe@example.com');
    expect(result).toBe('j***e@example.com');
  });

  it('redacts long token-like strings', () => {
    const token = 'A'.repeat(60);
    const result = sanitizeObject(token);
    expect(String(result)).toContain('REDACTED');
  });

  it('recurses into nested objects and arrays', () => {
    const result = sanitizeObject({
      user: { name: 'Jane', token: 'abcdefghijklmnop' },
      items: [{ secret: 'hidden-value-here' }],
    }) as Record<string, Record<string, unknown>>;
    expect(result.user.name).toBe('Jane');
    expect(String(result.user.token)).toContain('REDACTED');
  });

  it('caps recursion depth to prevent infinite loops', () => {
    type Recursive = { child?: Recursive; value: string };
    const deep: Recursive = { value: 'leaf' };
    let node = deep;
    for (let i = 0; i < 10; i++) {
      node.child = { value: 'leaf' };
      node = node.child;
    }
    expect(() => sanitizeObject(deep)).not.toThrow();
  });

  it('passes through null and undefined', () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });
});

describe('logger - truncateId', () => {
  it('returns [none] for empty input', () => {
    expect(truncateId(null)).toBe('[none]');
    expect(truncateId(undefined)).toBe('[none]');
    expect(truncateId('')).toBe('[none]');
  });

  it('returns short ids unchanged', () => {
    expect(truncateId('abc123')).toBe('abc123');
  });

  it('truncates long ids to first 8 chars', () => {
    expect(truncateId('11111111-2222-3333-4444-555555555555')).toBe('11111111...');
  });
});

describe('logger - log levels (development mode)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs debug/info/warn/error in development', () => {
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');
    expect(console.debug).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('sanitizes context passed to log methods', () => {
    logger.info('login', { username: 'jane', password: 'secret-pass-123' });
    const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
    const loggedContext = JSON.stringify(call);
    expect(loggedContext).not.toContain('secret-pass-123');
  });

  it('truncates user id in authEvent', () => {
    logger.authEvent('login_success', '11111111-2222-3333-4444-555555555555');
    const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.stringify(call)).toContain('11111111...');
  });
});
