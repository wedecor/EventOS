import { Global, Module } from '@nestjs/common';
import { createMailPort } from './mail.factory';
import { MAIL_PORT } from './mail.port';

@Global()
@Module({
  providers: [
    {
      provide: MAIL_PORT,
      useFactory: () => createMailPort(process.env),
    },
  ],
  exports: [MAIL_PORT],
})
export class MailModule {}
