const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer");
const { credentials } = require("../config");
const { saveRaw } = require("./_saveRaw");

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

module.exports = async function run() {
  // Cost Explorer is us-east-1 only
  const client = new CostExplorerClient({ region: "us-east-1", credentials });

  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);

  const data = await client.send(
    new GetCostAndUsageCommand({
      TimePeriod: { Start: isoDate(start), End: isoDate(end) },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
    })
  );
  saveRaw("cost-explorer", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
