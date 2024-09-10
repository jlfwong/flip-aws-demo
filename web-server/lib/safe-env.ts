const safeEnv = {
  AWS_REGION:
    "Available as aws_region in terraform/output/aws-config.json after running terraform",
  AWS_ACCESS_KEY:
    "Available as web_server_user_access_key in terraform/output/aws-config.json after running terraform",
  AWS_SECRET_KEY:
    "Available as web_server_user_secret_key in terraform/output/aws-config.json after running terraform",

  NEXT_PUBLIC_SUPABASE_URL:
    "Retrieve from https://supabase.com/dashboard/project/_/settings/api",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "Retrieve from https://supabase.com/dashboard/project/_/settings/api",
  SUPABASE_SERVICE_KEY:
    "Retrieve from https://supabase.com/dashboard/project/_/settings/api",

  FLIP_API_URL: "From https://developers.flip.energy/settings/credentials",
  FLIP_API_KEY: "From https://developers.flip.energy/settings/credentials",

  NEXT_PUBLIC_SITE_URL: "Should be http://localhost:3000 in development",
};

for (const key of Object.keys(safeEnv)) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}\n` +
        ` - ${safeEnv[key as keyof typeof safeEnv]}\n` +
        ` - Ensure this is set in your .env file or deployment environment`
    );
  }
  safeEnv[key as keyof typeof safeEnv] = value;
}

export default safeEnv;
