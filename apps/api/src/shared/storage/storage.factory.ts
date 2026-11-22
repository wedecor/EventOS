import { join } from 'node:path';
import {
  LocalStorageAdapter,
  normalizeLocalRoot,
} from './local-storage.adapter';
import { S3StorageAdapter } from './s3-storage.adapter';
import type { StoragePort } from './storage.port';

export type StorageEnv = {
  STORAGE_PROVIDER?: string;
  STORAGE_LOCAL_ROOT?: string;
  STORAGE_ENDPOINT?: string;
  STORAGE_ACCESS_KEY?: string;
  STORAGE_SECRET_KEY?: string;
  STORAGE_BUCKET?: string;
  STORAGE_REGION?: string;
};

export function createStoragePort(env: StorageEnv = process.env): StoragePort {
  const provider = (env.STORAGE_PROVIDER ?? 'local').toLowerCase();

  if (provider === 's3') {
    const accessKeyId = env.STORAGE_ACCESS_KEY;
    const secretAccessKey = env.STORAGE_SECRET_KEY;
    const bucket = env.STORAGE_BUCKET;
    if (!accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'STORAGE_PROVIDER=s3 requires STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, and STORAGE_BUCKET',
      );
    }
    return new S3StorageAdapter({
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION ?? 'auto',
      accessKeyId,
      secretAccessKey,
      bucket,
      forcePathStyle: true,
    });
  }

  const root = normalizeLocalRoot(
    env.STORAGE_LOCAL_ROOT ?? join(process.cwd(), '.data', 'storage'),
  );
  return new LocalStorageAdapter(root);
}
