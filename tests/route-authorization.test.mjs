import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const apiRoot = path.resolve("src/app/api");
const publicRoutes = new Set([
  path.join(apiRoot, "login/route.ts"),
  path.join(apiRoot, "logout/route.ts"),
]);

async function findRouteHandlers(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });
  const routes = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      routes.push(...(await findRouteHandlers(entryPath)));
    } else if (entry.name === "route.ts") {
      routes.push(entryPath);
    }
  }

  return routes;
}

test("every private Route Handler verifies the signed session", async () => {
  const routes = await findRouteHandlers(apiRoot);
  const unguarded = [];

  for (const route of routes) {
    if (publicRoutes.has(route)) continue;

    const source = await readFile(route, "utf8");

    if (!source.includes("hasAuthorizedSession")) {
      unguarded.push(path.relative(process.cwd(), route));
    }
  }

  assert.deepEqual(unguarded, []);
});

test("the login route issues the signed cookie, not the legacy value", async () => {
  const source = await readFile(
    path.join(apiRoot, "login/route.ts"),
    "utf8"
  );

  assert.match(source, /SESSION_COOKIE_NAME/);
  assert.doesNotMatch(
    source,
    /cookies\.set\(\s*["']scp_auth["']\s*,\s*["']authorized["']/
  );
});
