const { RDSClient, DescribeDBInstancesCommand } = require("@aws-sdk/client-rds");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new RDSClient({ region: env.AWS_REGION, credentials });
  const data = await client.send(new DescribeDBInstancesCommand({}));
  saveRaw("rds-instances", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
