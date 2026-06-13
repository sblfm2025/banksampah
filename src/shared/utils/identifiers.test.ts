import { describe, expect, it } from 'vitest';
import { formatTicketCode, stableIdentifier } from './identifiers';

describe('identifiers', () => {
  it('membuat identifier deterministik tanpa mengekspos nomor telepon', async () => {
    const first = await stableIdentifier('wa', '628123456789');
    const second = await stableIdentifier('wa', '628123456789');

    expect(first).toBe(second);
    expect(first).toMatch(/^wa_[a-f0-9]{32}$/);
    expect(first).not.toContain('628123456789');
  });

  it('membuat ticket code berurutan', () => {
    expect(formatTicketCode('20260613', 1)).toBe('JSP-20260613-0001');
    expect(formatTicketCode('20260613', 42)).toBe('JSP-20260613-0042');
  });

  it('menolak nomor urut di luar kapasitas harian', () => {
    expect(() => formatTicketCode('20260613', 10000)).toThrow();
  });
});
