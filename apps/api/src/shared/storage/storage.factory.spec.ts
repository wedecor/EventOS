import { GcsStorageAdapter } from './gcs-storage.adapter';
import { LocalStorageAdapter } from './local-storage.adapter';
import { createStoragePort } from './storage.factory';

describe('createStoragePort', () => {
  it('defaults to local', () => {
    const port = createStoragePort({ STORAGE_PROVIDER: undefined });
    expect(port).toBeInstanceOf(LocalStorageAdapter);
    expect(port.providerName).toBe('local');
  });

  it('creates a GCS adapter when STORAGE_PROVIDER=gcs and bucket is set', () => {
    const port = createStoragePort({
      STORAGE_PROVIDER: 'gcs',
      STORAGE_BUCKET: 'eventos-staging-files',
    });
    expect(port).toBeInstanceOf(GcsStorageAdapter);
    expect(port.providerName).toBe('gcs');
  });

  it('requires STORAGE_BUCKET for gcs', () => {
    expect(() => createStoragePort({ STORAGE_PROVIDER: 'gcs' })).toThrow(
      /STORAGE_BUCKET/,
    );
  });
});
