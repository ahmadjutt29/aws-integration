const { CloudWatchClient, GetMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const client = new CloudWatchClient({ region: env.AWS_REGION, credentials });
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

  const data = await client.send(
    new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        {
          Id: "m1",
          MetricStat: {
            Metric: { Namespace: env.METRICS_NAMESPACE, MetricName: env.METRICS_METRIC_NAME },
            Period: 3600,
            Stat: "Maximum",
          },
          ReturnData: true,
        },
      ],
    })
  );
  saveRaw("metrics-data", data);
  return data;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
