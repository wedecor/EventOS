export const STORAGE_PORT = Symbol('STORAGE_PORT');

export type StoragePutInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type StorageObject = {
  body: Buffer;
  contentType?: string;
};

export interface StoragePort {
  readonly providerName: string;
  put(input: StoragePutInput): Promise<void>;
  get(key: string): Promise<StorageObject>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
