import { createApp } from './app.js';
import { loadEnv, loadOptionalEnvFile } from './config/env.js';
import { logger } from './shared/logging/logger.js';

loadOptionalEnvFile();
const env = loadEnv();
const app = createApp();

app.listen(env.port, () => {
  logger.info('Fleet Management API listening', {
    port: env.port,
    nodeEnv: env.nodeEnv,
  });
});
