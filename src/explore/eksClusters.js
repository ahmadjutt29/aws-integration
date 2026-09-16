const { EKSClient, ListClustersCommand } = require("@aws-sdk/client-eks");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new EKSClient({ region: env.AWS_REGION, credentials });
  const data = await client.send(new ListClustersCommand({}));
  saveRaw("eks-clusters", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
