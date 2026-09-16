const { ConfigServiceClient, DescribeConfigurationAggregatorsCommand, ListDiscoveredResourcesCommand } = require("@aws-sdk/client-config-service");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new ConfigServiceClient({ region: env.AWS_REGION, credentials });

  const aggregators = await client.send(new DescribeConfigurationAggregatorsCommand({}));

  if (!aggregators.ConfigurationAggregators || aggregators.ConfigurationAggregators.length === 0) {
    const note = { note: "AWS Config not enabled on this account - no aggregator found. Use resourcesAll.js (Tagging API) as fallback for inventory." };
    saveRaw("config-resources", note);
    return note;
  }

  const data = await client.send(new ListDiscoveredResourcesCommand({ resourceType: "AWS::EC2::Instance" }));
  saveRaw("config-resources", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
