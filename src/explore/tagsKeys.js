const { ResourceGroupsTaggingAPIClient, GetTagKeysCommand } = require("@aws-sdk/client-resource-groups-tagging-api");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new ResourceGroupsTaggingAPIClient({ region: env.AWS_REGION, credentials });
  const data = await client.send(new GetTagKeysCommand({}));
  saveRaw("tags-keys", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
