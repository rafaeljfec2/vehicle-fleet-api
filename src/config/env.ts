import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

export type AppEnv = Readonly<{
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
}>;

function parseEnvLine(line: string): readonly [string, string] | undefined {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith('#')) {
    return undefined;
  }
  const separator = trimmed.indexOf('=');
  if (separator <= 0) {
    return undefined;
  }
  const key = trimmed.slice(0, separator).trim();
  let value = trimmed.slice(separator + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

/** Loads KEY=VALUE pairs from a local .env when present. Does not override existing process.env. */
export function loadOptionalEnvFile(
  filePath: string = resolve(process.cwd(), '.env'),
): void {
  if (!existsSync(filePath)) {
    return;
  }
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed === undefined) {
      continue;
    }
    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadEnv(
  source: NodeJS.ProcessEnv = process.env,
): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${message}`);
  }
  return {
    port: parsed.data.PORT,
    nodeEnv: parsed.data.NODE_ENV,
  };
}
