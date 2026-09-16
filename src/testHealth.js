const { HealthClient, DescribeEventsCommand } = require("@aws-sdk/client-health");
const { credentials, env } = require("./config");

module.exports = async function testHealth() {
  const health = new HealthClient({ region: "us-east-1", credentials }); // Health API is us-east-1 only

  try {
    const result = await health.send(new DescribeEventsCommand({ maxResults: 10 }));
    return {
      ok: true,
      detail: `${result.events.length} health event(s) returned`,
    };
  } catch (err) {
    if (err.name === "SubscriptionRequiredException") {
      return {
        ok: true,
        detail: "EXPECTED: account is on Basic/Developer support plan - AWS Health API requires Business or Enterprise support. Not a real failure.",
      };
    }
    throw err;
  }
};
