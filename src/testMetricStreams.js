const {
  CloudWatchClient,
  PutMetricStreamCommand,
  GetMetricStreamCommand,
  DeleteMetricStreamCommand,
} = require("@aws-sdk/client-cloudwatch");
const { credentials, env } = require("./config");

module.exports = async function testMetricStreams() {
  const cw = new CloudWatchClient({ region: env.AWS_REGION, credentials });

  // Create (or update) the metric stream pointed at the vendor's Firehose.
  // This is the continuous, push-based equivalent of Azure Diagnostic Settings.
  await cw.send(
    new PutMetricStreamCommand({
      Name: env.METRIC_STREAM_NAME,
      FirehoseArn: env.FIREHOSE_DELIVERY_STREAM_ARN,
      RoleArn: env.METRIC_STREAM_ROLE_ARN,
      OutputFormat: "json",
    })
  );

  const described = await cw.send(new GetMetricStreamCommand({ Name: env.METRIC_STREAM_NAME }));

  // Clean up after ourselves in test mode so repeated runs don't pile up streams
  await cw.send(new DeleteMetricStreamCommand({ Name: env.METRIC_STREAM_NAME }));

  return {
    ok: described.State === "running" || described.State === "starting_deployment",
    detail: `Stream created, state was "${described.State}", FirehoseArn=${described.FirehoseArn}. Deleted after check (test mode).`,
  };
};
