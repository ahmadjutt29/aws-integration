const { GuardDutyClient, ListDetectorsCommand, ListFindingsCommand } = require("@aws-sdk/client-guardduty");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new GuardDutyClient({ region: env.AWS_REGION, credentials });

  const detectors = await client.send(new ListDetectorsCommand({}));

  if (!detectors.DetectorIds || detectors.DetectorIds.length === 0) {
    const note = { note: "EXPECTED: GuardDuty is not enabled on this account (no detector found)." };
    saveRaw("guardduty-findings", note);
    return note;
  }

  const data = await client.send(new ListFindingsCommand({ DetectorId: detectors.DetectorIds[0] }));
  saveRaw("guardduty-findings", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
