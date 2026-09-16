const {
  CloudWatchLogsClient,
  StartQueryCommand,
  GetQueryResultsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");
const { credentials, env } = require("./config");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = async function testLogsInsights() {
  const logs = new CloudWatchLogsClient({ region: env.AWS_REGION, credentials });

  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - 24 * 60 * 60;

  const started = await logs.send(
    new StartQueryCommand({
      logGroupName: env.LOG_GROUP_NAME,
      startTime,
      endTime,
      queryString: "fields @timestamp, @message | sort @timestamp desc | limit 20",
    })
  );

  let result;
  for (let i = 0; i < 10; i++) {
    await sleep(1000);
    result = await logs.send(new GetQueryResultsCommand({ queryId: started.queryId }));
    if (result.status === "Complete") break;
  }

  return {
    ok: result.status === "Complete",
    detail: `Query status=${result.status}, ${result.results.length} row(s) returned from ${env.LOG_GROUP_NAME}`,
  };
};
