const { IAMClient, ListRolesCommand } = require("@aws-sdk/client-iam");
const { credentials } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  // IAM is a global service - always use us-east-1
  const client = new IAMClient({ region: "us-east-1", credentials });
  const data = await client.send(new ListRolesCommand({}));
  saveRaw("iam-roles", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
