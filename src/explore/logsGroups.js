const { CloudWatchLogsClient, DescribeLogGroupsCommand } = require("@aws-sdk/client-cloudwatch-logs");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new CloudWatchLogsClient({ region: env.AWS_REGION, credentials });
  const data = await client.send(new DescribeLogGroupsCommand({}));
  saveRaw("logs-groups", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
