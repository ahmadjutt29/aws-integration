const { CloudWatchClient, GetMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { credentials, env } = require("./config");

module.exports = async function testMetrics() {
  const cw = new CloudWatchClient({ region: env.AWS_REGION, credentials });

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // last 24h

  const result = await cw.send(
    new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        {
          Id: "m1",
          MetricStat: {
            Metric: {
              Namespace: env.METRICS_NAMESPACE,
              MetricName: env.METRICS_METRIC_NAME,
            },
            Period: 3600,
            Stat: "Maximum",
          },
          ReturnData: true,
        },
      ],
    })
  );

  const series = result.MetricDataResults[0];
  return {
    ok: true,
    detail: `Namespace=${env.METRICS_NAMESPACE} Metric=${env.METRICS_METRIC_NAME} -> ${series.Values.length} datapoints, status=${series.StatusCode}`,
  };
};
