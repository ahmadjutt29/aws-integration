const { ConfigServiceClient, DescribeConfigurationAggregatorsCommand } = require("@aws-sdk/client-config-service");
const { ResourceGroupsTaggingAPIClient, GetResourcesCommand } = require("@aws-sdk/client-resource-groups-tagging-api");
const { credentials, env } = require("./config");

module.exports = async function testConfig() {
  const configSvc = new ConfigServiceClient({ region: env.AWS_REGION, credentials });

  const aggregators = await configSvc.send(new DescribeConfigurationAggregatorsCommand({}));

  if (aggregators.ConfigurationAggregators && aggregators.ConfigurationAggregators.length > 0) {
    return {
      ok: true,
      detail: `AWS Config aggregator found: ${aggregators.ConfigurationAggregators[0].ConfigurationAggregatorName}`,
    };
  }

  // Fallback: customer has no Config Aggregator - use Tagging API for resource inventory instead
  const tagging = new ResourceGroupsTaggingAPIClient({ region: env.AWS_REGION, credentials });
  const resources = await tagging.send(new GetResourcesCommand({ ResourcesPerPage: 20 }));

  return {
    ok: true,
    detail: `No Config Aggregator on this account (expected for many customers). Fallback via Tagging API returned ${resources.ResourceTagMappingList.length} resource(s).`,
  };
};
