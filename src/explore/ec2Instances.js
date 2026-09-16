const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new EC2Client({ region: env.AWS_REGION, credentials });
  const data = await client.send(new DescribeInstancesCommand({}));
  saveRaw("ec2-instances", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
