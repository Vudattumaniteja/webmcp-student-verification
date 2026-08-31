import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MerchantStore } from './merchantStore';

describe('MerchantStore', () => {
  let store: MerchantStore;

  beforeEach(() => {
    store = new MerchantStore();
  });

  it('initializes with the required student merchant perks', () => {
    const merchants = store.getMerchants();
    expect(merchants.length).toBeGreaterThanOrEqual(5);

    const ids = merchants.map((m) => m.id);
    expect(ids).toContain('openai_chatgpt_plus');
    expect(ids).toContain('spotify_premium');
    expect(ids).toContain('aws_educate');
    expect(ids).toContain('notion_education');
    expect(ids).toContain('youtube_premium');
  });

  it('contains rich branding, pricing comparisons, discount values, and tags for all merchants', () => {
    // 1. OpenAI ChatGPT Plus
    const chatgpt = store.getMerchant('openai_chatgpt_plus');
    expect(chatgpt).toBeDefined();
    expect(chatgpt?.name).toContain('ChatGPT Plus');
    expect(chatgpt?.regularPrice).toBe('$20/mo');
    expect(chatgpt?.studentPrice).toContain('4 months free');
    expect(chatgpt?.discountValue).toBeTruthy();
    expect(chatgpt?.tags.length).toBeGreaterThan(0);
    expect(chatgpt?.perks.length).toBeGreaterThan(0);
    expect(chatgpt?.status).toBe('UNVERIFIED');

    // 2. Spotify Premium Student
    const spotify = store.getMerchant('spotify_premium');
    expect(spotify).toBeDefined();
    expect(spotify?.name).toContain('Spotify Premium');
    expect(spotify?.regularPrice).toBe('$11.99/mo');
    expect(spotify?.studentPrice).toContain('$5.99/mo');
    expect(spotify?.discountValue).toBeTruthy();

    // 3. AWS Educate
    const aws = store.getMerchant('aws_educate');
    expect(aws).toBeDefined();
    expect(aws?.name).toContain('AWS Educate');
    expect(aws?.studentPrice).toContain('$100');

    // 4. Notion Education Plus
    const notion = store.getMerchant('notion_education');
    expect(notion).toBeDefined();
    expect(notion?.name).toContain('Notion');
    expect(notion?.regularPrice).toBe('$10/mo');

    // 5. YouTube Premium Student
    const youtube = store.getMerchant('youtube_premium');
    expect(youtube).toBeDefined();
    expect(youtube?.name).toContain('YouTube Premium');
    expect(youtube?.regularPrice).toBe('$13.99/mo');
    expect(youtube?.studentPrice).toBe('$7.99/mo');
  });

  it('updates merchant status and reward code reactively', () => {
    const updated = store.updateMerchantStatus(
      'spotify_premium',
      'APPROVED',
      'EDU-SPOTIFY-8X29K',
    );

    expect(updated.status).toBe('APPROVED');
    expect(updated.rewardCode).toBe('EDU-SPOTIFY-8X29K');

    const fetched = store.getMerchant('spotify_premium');
    expect(fetched?.status).toBe('APPROVED');
    expect(fetched?.rewardCode).toBe('EDU-SPOTIFY-8X29K');
  });

  it('tracks merchant statuses independently without side-effects', () => {
    store.updateMerchantStatus('openai_chatgpt_plus', 'VERIFYING');
    store.updateMerchantStatus('spotify_premium', 'APPROVED', 'EDU-SPOT-123');
    store.updateMerchantStatus('aws_educate', 'ERROR', undefined, 'Verification failed: Expired ID');

    expect(store.getMerchant('openai_chatgpt_plus')?.status).toBe('VERIFYING');
    expect(store.getMerchant('spotify_premium')?.status).toBe('APPROVED');
    expect(store.getMerchant('aws_educate')?.status).toBe('ERROR');
    expect(store.getMerchant('aws_educate')?.errorMessage).toContain('Expired ID');
    expect(store.getMerchant('notion_education')?.status).toBe('UNVERIFIED');
    expect(store.getMerchant('youtube_premium')?.status).toBe('UNVERIFIED');
  });

  it('notifies subscribers on status updates and allows unsubscription', () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.updateMerchantStatus('notion_education', 'VERIFYING');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].find((m: any) => m.id === 'notion_education').status).toBe('VERIFYING');

    unsubscribe();
    store.updateMerchantStatus('notion_education', 'APPROVED', 'EDU-NOTION-77A');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('supports claimPerk to initiate verification state', () => {
    const result = store.claimPerk('youtube_premium');
    expect(result.status).toBe('VERIFYING');
    expect(store.getMerchant('youtube_premium')?.status).toBe('VERIFYING');
  });

  it('resets all merchants back to initial unverified state', () => {
    store.updateMerchantStatus('openai_chatgpt_plus', 'APPROVED', 'CODE1');
    store.updateMerchantStatus('spotify_premium', 'ERROR', undefined, 'Error 1');

    store.reset();

    const merchants = store.getMerchants();
    for (const m of merchants) {
      expect(m.status).toBe('UNVERIFIED');
      expect(m.rewardCode).toBeUndefined();
      expect(m.errorMessage).toBeUndefined();
    }
  });

  it('throws an error when updating non-existent merchant', () => {
    expect(() => {
      store.updateMerchantStatus('invalid_merchant_id', 'APPROVED');
    }).toThrow(/not found/i);
  });
});
