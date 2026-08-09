import { describe, it, expect } from 'vitest';
import { bytesMatchDeclaredType, validateUpload } from './fileValidation';

const bytes = (...b: number[]) => new Uint8Array([...b, ...Array(16 - b.length).fill(0)]);
const ascii = (s: string) => Array.from(s).map((c) => c.charCodeAt(0));

const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const WEBP = new Uint8Array([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP'), 0, 0, 0, 0]);
const WAV = new Uint8Array([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WAVE'), 0, 0, 0, 0]);
const SVG = new Uint8Array([...ascii('<svg xmlns="ht')]);

describe('bytesMatchDeclaredType', () => {
  it('accepts real PNG and JPEG', () => {
    expect(bytesMatchDeclaredType(PNG, 'image/png')).toBe(true);
    expect(bytesMatchDeclaredType(JPEG, 'image/jpeg')).toBe(true);
    expect(bytesMatchDeclaredType(JPEG, 'image/jpg')).toBe(true);
  });

  it('rejects a file renamed to a type it is not', () => {
    // The whole point: an SVG (or anything else) claiming to be a PNG.
    expect(bytesMatchDeclaredType(SVG, 'image/png')).toBe(false);
    expect(bytesMatchDeclaredType(PNG, 'image/jpeg')).toBe(false);
  });

  it('checks the WEBP tag, not just the RIFF container', () => {
    // A .wav is also RIFF; matching only the first four bytes would pass it.
    expect(bytesMatchDeclaredType(WEBP, 'image/webp')).toBe(true);
    expect(bytesMatchDeclaredType(WAV, 'image/webp')).toBe(false);
  });

  it('treats an unknown type as failing, not passing', () => {
    expect(bytesMatchDeclaredType(PNG, 'application/octet-stream')).toBe(false);
    expect(bytesMatchDeclaredType(SVG, 'image/svg+xml')).toBe(false);
  });
});

describe('validateUpload', () => {
  const opts = { accept: ['image/png', 'image/jpeg'], maxBytes: 1024 };
  const file = (data: Uint8Array, type: string, size?: number) =>
    ({
      type,
      size: size ?? data.length,
      slice: () => ({ arrayBuffer: async () => data.buffer }),
    }) as unknown as File;

  it('accepts a real PNG', async () => {
    expect(await validateUpload(file(PNG, 'image/png'), opts)).toBeNull();
  });

  it('rejects a disallowed type before reading bytes', async () => {
    expect(await validateUpload(file(PNG, 'image/gif'), opts)).toMatch(/PNG, JPEG/);
  });

  it('rejects an oversized file', async () => {
    expect(await validateUpload(file(PNG, 'image/png', 99999), opts)).toMatch(/less than 1KB/);
  });

  it('rejects content that does not match the declared type', async () => {
    expect(await validateUpload(file(SVG, 'image/png'), opts)).toMatch(/don't match its type/);
  });
});
