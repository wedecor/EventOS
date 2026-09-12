import { DynamicModule, Module } from '@nestjs/common';

export class JwtService {
  signAsync(payload: unknown): Promise<string> {
    return Promise.resolve(`mock-token-${JSON.stringify(payload)}`);
  }

  verify<T>(token: string): T {
    return JSON.parse(token.replace(/^mock-token-/, '')) as T;
  }
}

@Module({})
export class JwtModule {
  static register(): DynamicModule {
    return {
      module: JwtModule,
      providers: [JwtService],
      exports: [JwtService],
    };
  }

  static registerAsync(): DynamicModule {
    return JwtModule.register();
  }
}
