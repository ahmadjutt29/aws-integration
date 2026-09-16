const fs = require("fs");
const {
  CloudFormationClient,
  ValidateTemplateCommand,
  CreateStackCommand,
  DescribeStacksCommand,
  waitUntilStackCreateComplete,
} = require("@aws-sdk/client-cloudformation");
const { credentials, env } = require("./config");

module.exports = async function testCloudFormation() {
  // NOTE: this test uses the customer-sim account's OWN creds (not assumed role),
  // because deploying the onboarding stack is what the customer does themselves,
  // before the vendor role even exists. If CUSTOMER_ROLE_ARN creds are all you have
  // configured, ValidateTemplate will still work via the assumed role since it's
  // a read-only, account-agnostic call.
  const cfn = new CloudFormationClient({ region: env.AWS_REGION, credentials });

  const templateBody = fs.readFileSync(env.CFN_TEMPLATE_PATH, "utf-8");

  const validation = await cfn.send(new ValidateTemplateCommand({ TemplateBody: templateBody }));

  if (env.CFN_DEPLOY !== "true") {
    return {
      ok: true,
      detail: `Template valid. Params required: ${validation.Parameters.map((p) => p.ParameterKey).join(", ")}. (CFN_DEPLOY=false, skipped actual deploy)`,
    };
  }

  await cfn.send(
    new CreateStackCommand({
      StackName: env.CFN_STACK_NAME,
      TemplateBody: templateBody,
      Capabilities: ["CAPABILITY_NAMED_IAM"],
      Parameters: [
        { ParameterKey: "VendorAccountId", ParameterValue: env.VENDOR_ACCOUNT_ID },
        { ParameterKey: "ExternalId", ParameterValue: env.EXTERNAL_ID },
      ],
    })
  );

  await waitUntilStackCreateComplete(
    { client: cfn, maxWaitTime: 180 },
    { StackName: env.CFN_STACK_NAME }
  );

  const described = await cfn.send(new DescribeStacksCommand({ StackName: env.CFN_STACK_NAME }));
  const stack = described.Stacks[0];
  const roleArnOutput = stack.Outputs.find((o) => o.OutputKey === "RoleArn");

  return {
    ok: stack.StackStatus === "CREATE_COMPLETE",
    detail: `Stack status: ${stack.StackStatus}. RoleArn output: ${roleArnOutput?.OutputValue}`,
  };
};
