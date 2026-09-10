import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureAttribution,
  clearAttribution,
  getAttribution,
  getLeadAttribution,
} from './attribution';

describe('captureAttribution', () => {
  beforeEach(() => {
    clearAttribution();
  });

  it('records the campaign the visitor arrived on', () => {
    captureAttribution('?utm_source=instagram&utm_medium=social&utm_campaign=spring-open-house');
    expect(getAttribution()).toMatchObject({
      utm_source: 'instagram',
      utm_medium: 'social',
      utm_campaign: 'spring-open-house',
    });
  });

  it('keeps the campaign across an internal navigation that drops the parameters', () => {
    captureAttribution('?utm_source=instagram');
    // The visitor taps a listing: ?listing=<id>, no UTMs. This must not erase
    // the attribution one click after it arrived.
    captureAttribution('?listing=abc-123');
    expect(getAttribution()?.utm_source).toBe('instagram');
  });

  it('lets a fresh campaign click replace the previous touch', () => {
    captureAttribution('?utm_source=instagram&utm_campaign=spring');
    captureAttribution('?utm_source=facebook&utm_campaign=summer');
    expect(getAttribution()).toMatchObject({ utm_source: 'facebook', utm_campaign: 'summer' });
  });

  it('records the referrer of the page the campaign arrived on', () => {
    captureAttribution('?utm_source=newsletter', 'https://mail.example.com/x');
    expect(getAttribution()?.landing_referrer).toBe('https://mail.example.com/x');
  });

  it('stores nothing for a visit with no campaign', () => {
    expect(captureAttribution('?listing=abc')).toBeNull();
    expect(getAttribution()).toBeNull();
  });

  it('ignores empty and whitespace-only parameters', () => {
    captureAttribution('?utm_source=&utm_medium=%20&utm_campaign=real');
    expect(getAttribution()).toEqual({ utm_campaign: 'real' });
  });

  it('truncates a value too long for the column', () => {
    captureAttribution(`?utm_campaign=${'a'.repeat(400)}`);
    expect(getAttribution()?.utm_campaign).toHaveLength(255);
  });

  it('survives sessionStorage being unavailable', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    // The touch is still returned so a submission on this page is attributed.
    expect(captureAttribution('?utm_source=instagram')).toMatchObject({
      utm_source: 'instagram',
    });
    setItem.mockRestore();
  });
});

describe('getLeadAttribution', () => {
  beforeEach(() => {
    clearAttribution();
  });

  it('always reports a device, campaign or no campaign', () => {
    expect(getLeadAttribution().device).toBeTruthy();
    expect(getLeadAttribution().utm_source).toBeUndefined();
  });

  it('carries the campaign onto the lead', () => {
    captureAttribution('?utm_source=zillow&utm_medium=referral');
    const attribution = getLeadAttribution();
    expect(attribution.utm_source).toBe('zillow');
    expect(attribution.utm_medium).toBe('referral');
    expect(attribution.device).toBeTruthy();
  });
});
