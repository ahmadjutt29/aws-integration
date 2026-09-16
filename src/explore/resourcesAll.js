const { ResourceGroupsTaggingAPIClient, GetResourcesCommand } = require("@aws-sdk/client-resource-groups-tagging-api");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new ResourceGroupsTaggingAPIClient({ region: env.AWS_REGION, credentials });
  const data = await client.send(new GetResourcesCommand({ ResourcesPerPage: 100 }));
  saveRaw("resources-all", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
