/**
 * Validate all required environment variables on startup.
 * Exits with a clear error message rather than crashing later
 * with a cryptic "Cannot read properties of undefined".
 */

const REQUIRED = [
  { key: 'DATABASE_URL',       hint: 'PostgreSQL connection string' },
  { key: 'JWT_SECRET',         hint: 'Min 32 chars — used to sign tokens' },
  { key: 'ANTHROPIC_API_KEY',  hint: 'From console.anthropic.com' },
];

const OPTIONAL_WITH_DEFAULTS = [
  { key: 'REDIS_URL',          default: 'redis://localhost:6379' },
  { key: 'PORT',               default: '4000' },
  { key: 'NODE_ENV',           default: 'development' },
  { key: 'MAX_FILE_SIZE_MB',   default: '50' },
  { key: 'JWT_EXPIRES_IN',     default: '7d' },
  { key: 'CLAUDE_MODEL',       default: 'claude-sonnet-4-20250514' },
  { key: 'FRONTEND_URL',       default: 'http://localhost:3000' },
];

const STORAGE_REQUIRED_IN_PROD = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
];

function validateEnv() {
  const errors = [];
  const warnings = [];
  const isProd = process.env.NODE_ENV === 'production';

  // Check required vars
  for (const { key, hint } of REQUIRED) {
    if (!process.env[key]) {
      errors.push(`  ✗ ${key} is not set  (${hint})`);
    }
  }

  // Apply defaults for optional vars
  for (const { key, default: val } of OPTIONAL_WITH_DEFAULTS) {
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }

  // Storage vars required in production
  if (isProd) {
    for (const key of STORAGE_REQUIRED_IN_PROD) {
      if (!process.env[key]) {
        errors.push(`  ✗ ${key} is required in production`);
      }
    }
  } else {
    for (const key of STORAGE_REQUIRED_IN_PROD) {
      if (!process.env[key]) {
        warnings.push(`  ⚠ ${key} not set — S3 uploads will fail`);
      }
    }
  }

  // JWT secret length check
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('  ✗ JWT_SECRET must be at least 32 characters for security');
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn('\n[config] Environment warnings:');
    warnings.forEach((w) => console.warn(w));
  }

  // Print errors and exit
  if (errors.length > 0) {
    console.error('\n[config] ❌ Missing or invalid environment variables:\n');
    errors.forEach((e) => console.error(e));
    console.error('\n  Copy backend/.env.example to backend/.env and fill in the values.\n');
    process.exit(1);
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[config] Environment validated (${process.env.NODE_ENV})`);
  }
}

module.exports = { validateEnv };
