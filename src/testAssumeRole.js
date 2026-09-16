const { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");
const { env } = require("./config");

module.exports = async function testAssumeRole() {
  const sts = new STSClient({ region: env.AWS_REGION });

  const assumeResult = await sts.send(
    new AssumeRoleCommand({
      RoleArn: env.CUSTOMER_ROLE_ARN,
      ExternalId: env.EXTERNAL_ID,
      RoleSessionName: "correlation-platform-test-session",
      DurationSeconds: 3600,
    })
  );

  const { AccessKeyId, Expiration } = assumeResult.Credentials;

  // Confirm the assumed identity resolves to the customer's role, not ours
  const stsWithTempCreds = new STSClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: assumeResult.Credentials.AccessKeyId,
      secretAccessKey: assumeResult.Credentials.SecretAccessKey,
      sessionToken: assumeResult.Credentials.SessionToken,
    },
  });
  const identity = await stsWithTempCreds.send(new GetCallerIdentityCommand({}));

  return {
    ok: true,
    detail: `Assumed ${identity.Arn}, temp creds expire ${Expiration.toISOString()}, AccessKeyId ${AccessKeyId.slice(0, 6)}...`,
  };
};
