const { SecurityHubClient, GetFindingsCommand } = require("@aws-sdk/client-securityhub");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new SecurityHubClient({ region: env.AWS_REGION, credentials });
  try {
    const data = await client.send(new GetFindingsCommand({ MaxResults: 20 }));
    saveRaw("security-hub-findings", data);
    return data;
  } catch (err) {
    if (err.name === "InvalidAccessException") {
      const note = { note: "EXPECTED: Security Hub is not enabled on this account." };
      saveRaw("security-hub-findings", note);
      return note;
    }
    throw err;
  }
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
