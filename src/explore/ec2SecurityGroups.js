const { EC2Client, DescribeSecurityGroupsCommand } = require("@aws-sdk/client-ec2");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new EC2Client({ region: env.AWS_REGION, credentials });
  const data = await client.send(new DescribeSecurityGroupsCommand({}));
  saveRaw("ec2-security-groups", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
