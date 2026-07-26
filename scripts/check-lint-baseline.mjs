import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");

export function summarizeLintResults(results, root = projectRoot) {
  const summary = {
    errors: 0,
    warnings: 0,
    byFileRule: {},
  };

  for (const result of results) {
    const file = path.relative(root, result.filePath);

    for (const message of result.messages) {
      const severity = message.severity === 2 ? "error" : "warning";
      const key = `${file}::${message.ruleId ?? "parse"}::${severity}`;

      summary[`${severity}s`] += 1;
      summary.byFileRule[key] = (summary.byFileRule[key] ?? 0) + 1;
    }
  }

  return summary;
}

export function compareLintSummaries(baseline, current) {
  const failures = [];

  if (current.errors > baseline.errors) {
    failures.push(
      `Error count increased from ${baseline.errors} to ${current.errors}.`
    );
  }

  if (current.warnings > baseline.warnings) {
    failures.push(
      `Warning count increased from ${baseline.warnings} to ${current.warnings}.`
    );
  }

  for (const [key, count] of Object.entries(current.byFileRule)) {
    const allowed = baseline.byFileRule[key] ?? 0;

    if (count > allowed) {
      failures.push(`${key} increased from ${allowed} to ${count}.`);
    }
  }

  return failures;
}

function run() {
  const baseline = JSON.parse(
    fs.readFileSync(
      path.join(scriptDirectory, "lint-baseline.json"),
      "utf8"
    )
  );
  const eslintBin = path.join(
    projectRoot,
    "node_modules",
    "eslint",
    "bin",
    "eslint.js"
  );
  const result = spawnSync(
    process.execPath,
    [eslintBin, ".", "--format", "json"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (!result.stdout) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  const current = summarizeLintResults(
    JSON.parse(result.stdout),
    projectRoot
  );
  const failures = compareLintSummaries(baseline, current);

  console.log(
    `Lint debt: ${current.errors} errors, ${current.warnings} warnings ` +
      `(ratchet ceiling: ${baseline.errors}/${baseline.warnings}).`
  );

  if (failures.length > 0) {
    console.error("Lint ratchet failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    "Lint ratchet passed. Existing debt is visible and no bucket increased."
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run();
}
