const { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } = require("@aws-sdk/client-elastic-load-balancing-v2");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new ElasticLoadBalancingV2Client({ region: env.AWS_REGION, credentials });
  const data = await client.send(new DescribeLoadBalancersCommand({}));
  saveRaw("load-balancers", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
