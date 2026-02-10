/**
 * Tests for src/lib/utm.ts
 *
 * UTM parameter parsing, storage, and attribution context.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseUtmParams, getStoredUtmParams, storeUtmParams, captureUtmParams, getAttributionContext } from '@/lib/utm';

// Mock sessionStorage
const store = new Map<string, string>();
const mockSessionStorage = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => store.set(key, value)),
  removeItem: vi.fn((key: string) => store.delete(key)),
  clear: vi.fn(() => store.clear()),
  get length() { return store.size; },
  key: vi.fn((i: number) => [...store.keys()][i] ?? null),
};

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock window.location
const mockLocation = {
  search: '',
  pathname: '/',
  href: 'http://localhost/',
};

Object.defineProperty(globalThis, 'window', {
  value: { location: mockLocation },
  writable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: { referrer: '' },
  writable: true,
});

describe('parseUtmParams', () => {
  it('parses all UTM parameters from search string', () => {
    const result = parseUtmParams(
      '?utm_source=twitter&utm_medium=social&utm_campaign=launch&utm_content=header&utm_term=ai+debate'
    );
    expect(result).toEqual({
      utm_source: 'twitter',
      utm_medium: 'social',
      utm_campaign: 'launch',
      utm_content: 'header',
      utm_term: 'ai debate',
    });
  });

  it('handles partial UTM params', () => {
    const result = parseUtmParams('?utm_source=google&utm_medium=cpc');
    expect(result).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
    });
  });

  it('returns empty for no UTM params', () => {
    const result = parseUtmParams('?page=1&sort=newest');
    expect(result).toEqual({});
  });

  it('returns empty for empty search', () => {
    const result = parseUtmParams('');
    expect(result).toEqual({});
  });

  it('ignores non-UTM params', () => {
    const result = parseUtmParams('?ref=abc&utm_source=twitter&other=123');
    expect(result).toEqual({ utm_source: 'twitter' });
  });
});

describe('storeUtmParams / getStoredUtmParams', () => {
  beforeEach(() => {
    store.clear();
  });

  it('stores and retrieves UTM params', () => {
    storeUtmParams({ utm_source: 'test', landing_page: '/' });
    const stored = getStoredUtmParams();
    expect(stored.utm_source).toBe('test');
    expect(stored.landing_page).toBe('/');
  });

  it('returns empty object when nothing stored', () => {
    const stored = getStoredUtmParams();
    expect(stored).toEqual({});
  });

  it('does not store when all values are empty/undefined', () => {
    storeUtmParams({});
    expect(store.size).toBe(0);
  });
});

describe('captureUtmParams', () => {
  beforeEach(() => {
    store.clear();
    mockLocation.search = '';
    mockLocation.pathname = '/';
    (document as { referrer: string }).referrer = '';
  });

  it('captures UTM params from URL', () => {
    mockLocation.search = '?utm_source=twitter&utm_campaign=launch';
    mockLocation.pathname = '/blog';

    const result = captureUtmParams();
    expect(result.utm_source).toBe('twitter');
    expect(result.utm_campaign).toBe('launch');
    expect(result.landing_page).toBe('/blog');
    expect(result.captured_at).toBeDefined();
  });

  it('captures referrer when no UTM params', () => {
    (document as { referrer: string }).referrer = 'https://google.com';
    
    const result = captureUtmParams();
    expect(result.referrer).toBe('https://google.com');
    expect(result.utm_source).toBeUndefined();
  });

  it('returns existing params when no new UTM in URL', () => {
    // First visit with UTM
    storeUtmParams({ utm_source: 'twitter', landing_page: '/' });
    
    // Second page load without UTM
    mockLocation.search = '';
    const result = captureUtmParams();
    expect(result.utm_source).toBe('twitter');
  });

  it('overwrites existing params when new UTM params in URL', () => {
    storeUtmParams({ utm_source: 'old_source', landing_page: '/' });
    
    mockLocation.search = '?utm_source=new_source';
    const result = captureUtmParams();
    expect(result.utm_source).toBe('new_source');
  });
});

describe('getAttributionContext', () => {
  beforeEach(() => {
    store.clear();
  });

  it('returns flat object from stored UTM params', () => {
    storeUtmParams({
      utm_source: 'twitter',
      utm_medium: 'social',
      landing_page: '/blog',
      referrer: 'https://t.co',
    });

    const ctx = getAttributionContext();
    expect(ctx.utm_source).toBe('twitter');
    expect(ctx.utm_medium).toBe('social');
    expect(ctx.landing_page).toBe('/blog');
    expect(ctx.referrer).toBe('https://t.co');
  });

  it('returns undefined values when nothing stored', () => {
    const ctx = getAttributionContext();
    expect(ctx.utm_source).toBeUndefined();
    expect(ctx.utm_medium).toBeUndefined();
  });
});
