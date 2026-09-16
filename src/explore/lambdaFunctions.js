const { LambdaClient, ListFunctionsCommand } = require("@aws-sdk/client-lambda");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new LambdaClient({ region: env.AWS_REGION, credentials });
  const data = await client.send(new ListFunctionsCommand({}));
  saveRaw("lambda-functions", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
