const fs = require("fs");
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "..", "..", "results");

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Saves the raw API response to results/<name>.json (pretty-printed)
 * and also prints a short summary to console.
 */
function saveRaw(name, data) {
  const filePath = path.join(RESULTS_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved: results/${name}.json`);
  return filePath;
}

module.exports = { saveRaw, RESULTS_DIR };
