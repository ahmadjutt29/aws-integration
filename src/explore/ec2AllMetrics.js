const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { CloudWatchClient, ListMetricsCommand, GetMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { credentials, env } = require("../config");
const { saveRaw } = require("./_saveRaw");

module.exports = async function run() {
  const ec2 = new EC2Client({ region: env.AWS_REGION, credentials });
  const cw = new CloudWatchClient({ region: env.AWS_REGION, credentials });

  // Step 1: get every EC2 instance ID in the account
  const instancesResp = await ec2.send(new DescribeInstancesCommand({}));
  const instanceIds = [];
  for (const reservation of instancesResp.Reservations) {
    for (const instance of reservation.Instances) {
      instanceIds.push(instance.InstanceId);
    }
  }

  if (instanceIds.length === 0) {
    const note = { note: "No EC2 instances found in this account - nothing to pull metrics for." };
    saveRaw("ec2-all-metrics", note);
    return note;
  }

  // Step 2: get every distinct metric name AWS publishes for EC2
  const metricsResp = await cw.send(new ListMetricsCommand({ Namespace: "AWS/EC2" }));
  const metricNames = [...new Set(metricsResp.Metrics.map((m) => m.MetricName))];

  // Step 3: for each instance, pull last 24h of every metric in one batched call
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
  const results = {};

  for (const instanceId of instanceIds) {
    const queries = metricNames.map((metricName, i) => ({
      Id: `m${i}`,
      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: metricName,
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },
        Period: 300,
        Stat: "Average",
      },
      ReturnData: true,
    }));

    // CloudWatch allows max 500 queries per call - EC2 has ~20 metrics so one call is enough
    const data = await cw.send(new GetMetricDataCommand({ StartTime: startTime, EndTime: endTime, MetricDataQueries: queries }));

    results[instanceId] = data.MetricDataResults.map((r, i) => ({
      metricName: metricNames[i],
      datapointCount: r.Values.length,
      values: r.Values,
      timestamps: r.Timestamps,
    }));
  }

  saveRaw("ec2-all-metrics", results);
  return results;
};

if (require.main === module) {
  module.exports().catch((err) => console.error(err));
}
