const { ECSClient, ListClustersCommand } = require("@aws-sdk/client-ecs");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new ECSClient({ region: env.AWS_REGION, credentials });
  const data = await client.send(new ListClustersCommand({}));
  saveRaw("ecs-clusters", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
