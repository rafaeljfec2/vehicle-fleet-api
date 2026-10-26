import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadEnv, loadOptionalEnvFile } from '../../src/config/env.js';

const originalPort = process.env['PORT'];
const originalNodeEnv = process.env['NODE_ENV'];

afterEach(() => {
  if (originalPort === undefined) {
    delete process.env['PORT'];
  } else {
    process.env['PORT'] = originalPort;
  }
  if (originalNodeEnv === undefined) {
    delete process.env['NODE_ENV'];
  } else {
    process.env['NODE_ENV'] = originalNodeEnv;
  }
});

describe('env loading', () => {
  it('loads missing keys from a .env file without overriding existing values', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-env-'));
    const filePath = join(dir, '.env');
    writeFileSync(filePath, 'PORT=4123\nNODE_ENV=test\n');

    delete process.env['PORT'];
    process.env['NODE_ENV'] = 'production';

    loadOptionalEnvFile(filePath);
    const env = loadEnv();

    expect(env.port).toBe(4123);
    expect(env.nodeEnv).toBe('production');
  });

  it('ignores a missing .env file', () => {
    delete process.env['PORT'];
    loadOptionalEnvFile(join(tmpdir(), 'fleet-env-missing', '.env'));
    expect(loadEnv().port).toBe(3000);
  });
});
