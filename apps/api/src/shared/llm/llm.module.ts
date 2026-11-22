import { Global, Module } from '@nestjs/common';
import { createLlmPort } from './llm.factory';
import { LLM_PORT } from './llm.port';

@Global()
@Module({
  providers: [
    {
      provide: LLM_PORT,
      useFactory: () => createLlmPort(process.env),
    },
  ],
  exports: [LLM_PORT],
})
export class LlmModule {}
