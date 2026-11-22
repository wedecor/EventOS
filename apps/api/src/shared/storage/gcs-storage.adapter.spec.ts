import { GcsStorageAdapter } from './gcs-storage.adapter';

type FakeFile = {
  save: jest.Mock;
  download: jest.Mock;
  getMetadata: jest.Mock;
  delete: jest.Mock;
  exists: jest.Mock;
};

describe('GcsStorageAdapter', () => {
  let files: Map<string, FakeFile>;
  let bucket: { file: jest.Mock };
  let adapter: GcsStorageAdapter;

  const fileFor = (key: string): FakeFile => {
    const existing = files.get(key);
    if (existing) {
      return existing;
    }
    const created: FakeFile = {
      save: jest.fn().mockResolvedValue(undefined),
      download: jest.fn().mockResolvedValue([Buffer.from('payload')]),
      getMetadata: jest
        .fn()
        .mockResolvedValue([{ contentType: 'application/pdf' }]),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue([true]),
    };
    files.set(key, created);
    return created;
  };

  beforeEach(() => {
    files = new Map();
    bucket = {
      file: jest.fn((key: string) => fileFor(key)),
    };
    adapter = new GcsStorageAdapter(
      { bucket: 'eventos-staging-files' },
      bucket as never,
    );
  });

  it('exposes providerName gcs', () => {
    expect(adapter.providerName).toBe('gcs');
  });

  it('puts an object with content type and non-resumable upload', async () => {
    await adapter.put({
      key: 'tenants/t1/doc.pdf',
      body: Buffer.from('%PDF'),
      contentType: 'application/pdf',
    });

    expect(bucket.file).toHaveBeenCalledWith('tenants/t1/doc.pdf');
    expect(fileFor('tenants/t1/doc.pdf').save).toHaveBeenCalledWith(
      Buffer.from('%PDF'),
      { contentType: 'application/pdf', resumable: false },
    );
  });

  it('gets body and content type', async () => {
    const result = await adapter.get('tenants/t1/doc.pdf');
    expect(result.body.toString()).toBe('payload');
    expect(result.contentType).toBe('application/pdf');
  });

  it('deletes with ignoreNotFound', async () => {
    await adapter.delete('missing.pdf');
    expect(fileFor('missing.pdf').delete).toHaveBeenCalledWith({
      ignoreNotFound: true,
    });
  });

  it('reports exists from the GCS file API', async () => {
    fileFor('a').exists.mockResolvedValueOnce([false]);
    await expect(adapter.exists('a')).resolves.toBe(false);
    fileFor('b').exists.mockResolvedValueOnce([true]);
    await expect(adapter.exists('b')).resolves.toBe(true);
  });
});
