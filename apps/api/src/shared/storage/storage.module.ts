import { Global, Module } from '@nestjs/common';
import { createStoragePort } from './storage.factory';
import { STORAGE_PORT } from './storage.port';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PORT,
      useFactory: () => createStoragePort(process.env),
    },
  ],
  exports: [STORAGE_PORT],
})
export class StorageModule {}
