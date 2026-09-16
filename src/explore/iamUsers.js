const { IAMClient, ListUsersCommand } = require("@aws-sdk/client-iam");
const { credentials } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new IAMClient({ region: "us-east-1", credentials });
  const data = await client.send(new ListUsersCommand({}));
  saveRaw("iam-users", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
