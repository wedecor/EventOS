import {
  buildStorageKey,
  validateDocumentUpload,
} from './document-upload.validation';

describe('document-upload.validation', () => {
  it('accepts allowed PDF uploads', () => {
    const result = validateDocumentUpload({
      originalName: 'contract.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.safeFileName).toContain('contract');
    }
  });

  it('rejects disallowed MIME types', () => {
    const result = validateDocumentUpload({
      originalName: 'x.exe',
      mimeType: 'application/octet-stream',
      sizeBytes: 10,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects oversized files', () => {
    const result = validateDocumentUpload({
      originalName: 'big.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 20_000_000,
      maxBytes: 1000,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects path traversal characters in names by sanitizing', () => {
    const result = validateDocumentUpload({
      originalName: '../../etc/passwd.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.safeFileName).not.toContain('..');
      expect(result.safeFileName).not.toContain('/');
    }
  });

  it('builds tenant-scoped storage keys without client path input', () => {
    const key = buildStorageKey(
      'tenant-1',
      '.pdf',
      new Date('2026-11-12T00:00:00Z'),
    );
    expect(key.startsWith('tenant-1/2026/11/')).toBe(true);
    expect(key.endsWith('.pdf')).toBe(true);
    expect(key.includes('..')).toBe(false);
  });
});
