const { HealthClient, DescribeEventsCommand } = require("@aws-sdk/client-health");
const { credentials } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new HealthClient({ region: "us-east-1", credentials }); // Health API is us-east-1 only
  try {
    const data = await client.send(new DescribeEventsCommand({ maxResults: 20 }));
    saveRaw("health-events", data);
    return data;
  } catch (err) {
    if (err.name === "SubscriptionRequiredException") {
      const note = { note: "EXPECTED: Basic/Developer support plan does not include Health API data." };
      saveRaw("health-events", note);
      return note;
    }
    throw err;
  }
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
