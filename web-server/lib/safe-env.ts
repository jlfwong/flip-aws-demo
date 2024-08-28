type KnownEnvVar =
  'AWS_ACCESS_KEY_ID' |
  'AWS_SECRET_ACCESS_KEY' |
  'AWS_REGION'

export function safeGetEnv(name: KnownEnvVar): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}\n` +
      `Ensure this is set in your .env file or deployment environment.`
    );
  }
  return value;
}