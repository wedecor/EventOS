import { Storage, type Bucket } from '@google-cloud/storage';
import type {
  StorageObject,
  StoragePort,
  StoragePutInput,
} from './storage.port';

export type GcsStorageConfig = {
  bucket: string;
  /** Optional; ADC on Cloud Run already scopes the project. */
  projectId?: string;
};

/**
 * Native Google Cloud Storage adapter (M5-01 durable uploads).
 *
 * Uses Application Default Credentials — on Cloud Run that is the environment's
 * runtime service account (no HMAC keys). Prefer this over the S3-compatible
 * GCS XML API so staging/prod never need long-lived access keys in Secret Manager.
 */
export class GcsStorageAdapter implements StoragePort {
  readonly providerName = 'gcs';
  private readonly bucket: Bucket;

  constructor(config: GcsStorageConfig, bucket?: Bucket) {
    this.bucket =
      bucket ??
      new Storage(
        config.projectId ? { projectId: config.projectId } : undefined,
      ).bucket(config.bucket);
  }

  async put(input: StoragePutInput): Promise<void> {
    await this.bucket.file(input.key).save(input.body, {
      contentType: input.contentType,
      resumable: false,
    });
  }

  async get(key: string): Promise<StorageObject> {
    const file = this.bucket.file(key);
    const [body] = await file.download();
    const [metadata] = await file.getMetadata();
    const contentType =
      typeof metadata.contentType === 'string'
        ? metadata.contentType
        : undefined;
    return { body, contentType };
  }

  async delete(key: string): Promise<void> {
    await this.bucket.file(key).delete({ ignoreNotFound: true });
  }

  async exists(key: string): Promise<boolean> {
    const [exists] = await this.bucket.file(key).exists();
    return exists;
  }
}
