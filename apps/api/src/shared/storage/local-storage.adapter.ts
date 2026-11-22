import { mkdir, readFile, unlink, writeFile, access } from 'node:fs/promises';
import { dirname, join, normalize, resolve } from 'node:path';
import { constants } from 'node:fs';
import type {
  StorageObject,
  StoragePort,
  StoragePutInput,
} from './storage.port';

export class LocalStorageAdapter implements StoragePort {
  readonly providerName = 'local';

  constructor(private readonly rootDir: string) {}

  private resolveSafe(key: string): string {
    const normalizedKey = key.replace(/^\/+/, '').replace(/\\/g, '/');
    if (
      normalizedKey.includes('..') ||
      normalizedKey.includes('\0') ||
      normalizedKey.startsWith('/')
    ) {
      throw new Error('Invalid storage key');
    }
    const absolute = resolve(join(this.rootDir, normalizedKey));
    const root = resolve(this.rootDir);
    if (!absolute.startsWith(root + '/') && absolute !== root) {
      throw new Error('Path traversal rejected');
    }
    return absolute;
  }

  async put(input: StoragePutInput): Promise<void> {
    const path = this.resolveSafe(input.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, input.body);
  }

  async get(key: string): Promise<StorageObject> {
    const path = this.resolveSafe(key);
    const body = await readFile(path);
    return { body };
  }

  async delete(key: string): Promise<void> {
    const path = this.resolveSafe(key);
    try {
      await unlink(path);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (code !== 'ENOENT') throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolveSafe(key), constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}

/** Exported for unit tests. */
export function assertSafeStorageKey(key: string, rootDir: string): string {
  return new LocalStorageAdapter(rootDir)['resolveSafe'](key);
}

export function normalizeLocalRoot(root: string): string {
  return normalize(resolve(root));
}
