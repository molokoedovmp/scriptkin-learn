import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

export function hashEmailVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueEmailVerificationToken(
  client: PoolClient,
  userId: string
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashEmailVerificationToken(token);

  await client.query(
    `DELETE FROM email_verification_tokens
      WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );
  await client.query(
    `INSERT INTO email_verification_tokens (
       token_hash, user_id, expires_at
     ) VALUES ($1, $2, now() + INTERVAL '24 hours')`,
    [tokenHash, userId]
  );

  return token;
}
