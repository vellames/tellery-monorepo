import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLocalUuid } from '@/lib/local-uuid';

const LOCAL_UUID_KEY = 'ai-history.localUuid';

describe('getLocalUuid', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the stored uuid when present', () => {
    window.localStorage.setItem(LOCAL_UUID_KEY, 'stored-uuid');

    expect(getLocalUuid()).toBe('stored-uuid');
  });

  it('returns a generated uuid when localStorage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(getLocalUuid()).toEqual(expect.any(String));
  });
});
