import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generate, regenerateUrl } from './certificate.service.js';

// vi.hoisted ensures these are available to the hoisted vi.mock call
const {
  mockSupabase,
  mockSingle,
  mockUpdate,
  mockUpload,
  mockCreateSignedUrl,
  mockQueryBuilder,
} = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockUpdate = vi.fn();
  const mockUpload = vi.fn();
  const mockCreateSignedUrl = vi.fn();

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    update: mockUpdate,
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
  };

  mockUpdate.mockReturnValue(mockQueryBuilder);

  const mockStorageBucket = {
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
  };

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
    storage: {
      from: vi.fn(() => mockStorageBucket),
    },
  };

  return {
    mockSupabase,
    mockSingle,
    mockUpdate,
    mockUpload,
    mockCreateSignedUrl,
    mockQueryBuilder,
  };
});

vi.mock('../../config/supabase.js', () => ({
  supabaseAdmin: mockSupabase,
}));

describe('certificate.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('should successfully generate a PDF certificate, upload to Supabase, generate signed URL, and update history', async () => {
      // 1. Mock donor query -> returns donor name
      mockSingle.mockResolvedValueOnce({
        data: { full_name: 'John Doe' },
        error: null,
      });

      // 2. Mock history query -> returns history details
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'hist-1234-5678',
          blood_group: 'O+',
          units_donated: 1,
          donated_at: '2026-06-11T12:00:00Z',
          hospitals: { name: 'City Hospital' },
        },
        error: null,
      });

      // 3. Mock Storage Upload -> success
      mockUpload.mockResolvedValueOnce({ data: { path: 'some-path' }, error: null });

      // 4. Mock signed URL generation -> success
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://supabase-storage.co/signed-cert.pdf' },
        error: null,
      });

      // 5. Mock history update success
      mockUpdate.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.eq.mockReturnThis();

      const signedUrl = await generate('donor-456', 'hist-1234-5678');

      expect(signedUrl).toBe('https://supabase-storage.co/signed-cert.pdf');

      // Assertions
      expect(mockSupabase.from).toHaveBeenCalledWith('donors');
      expect(mockSupabase.from).toHaveBeenCalledWith('donation_history');
      expect(mockUpload).toHaveBeenCalledWith(
        'certificates/donor-456/hist-1234-5678.pdf',
        expect.any(Uint8Array),
        { contentType: 'application/pdf', upsert: true }
      );
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        'certificates/donor-456/hist-1234-5678.pdf',
        604800
      );
      expect(mockUpdate).toHaveBeenCalledWith({
        certificate_url: 'https://supabase-storage.co/signed-cert.pdf',
        certificate_key: 'certificates/donor-456/hist-1234-5678.pdf',
      });
    });
  });

  describe('regenerateUrl', () => {
    it('should successfully regenerate signed URL using the key from database and update history', async () => {
      // 1. Mock history key query -> returns key
      mockSingle.mockResolvedValueOnce({
        data: { certificate_key: 'certificates/donor-456/hist-1234-5678.pdf' },
        error: null,
      });

      // 2. Mock signed URL generation -> success
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://supabase-storage.co/new-signed-cert.pdf' },
        error: null,
      });

      // 3. Mock history update success
      mockUpdate.mockReturnValueOnce(mockQueryBuilder);

      const newUrl = await regenerateUrl('hist-1234-5678');

      expect(newUrl).toBe('https://supabase-storage.co/new-signed-cert.pdf');

      // Assertions
      expect(mockSupabase.from).toHaveBeenCalledWith('donation_history');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        'certificates/donor-456/hist-1234-5678.pdf',
        604800
      );
      expect(mockUpdate).toHaveBeenCalledWith({
        certificate_url: 'https://supabase-storage.co/new-signed-cert.pdf',
      });
    });
  });
});
