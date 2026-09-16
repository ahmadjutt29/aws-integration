require("dotenv").config();
const { fromTemporaryCredentials } = require("@aws-sdk/credential-providers");

const REQUIRED_VARS = ["CUSTOMER_ROLE_ARN", "EXTERNAL_ID", "AWS_REGION"];

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

// Single shared credentials provider - assumes the customer role ONCE,
// SDK auto-refreshes the temp creds (1hr) for every client built from this.
const credentials = fromTemporaryCredentials({
  params: {
    RoleArn: process.env.CUSTOMER_ROLE_ARN,
    ExternalId: process.env.EXTERNAL_ID,
    RoleSessionName: "correlation-platform-test-session",
    DurationSeconds: 3600,
  },
});

module.exports = {
  region: process.env.AWS_REGION,
  credentials,
  env: process.env,
};
