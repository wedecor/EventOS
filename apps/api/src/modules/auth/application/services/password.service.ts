import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// docs/14 §Password Policy: "Hashing algorithm — bcrypt (cost factor 12) or Argon2id".
const BCRYPT_COST_FACTOR = 12;

@Injectable()
export class PasswordService {
  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, BCRYPT_COST_FACTOR);
  }

  compare(plainText: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainText, passwordHash);
  }
}
