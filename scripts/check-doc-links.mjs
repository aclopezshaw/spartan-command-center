import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const documentationRoot = join(repositoryRoot, "docs");
const rootDocuments = ["README.md", "CONTRIBUTING.md", "CHANGELOG.md"];
const markdownLinkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;

function collectMarkdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectMarkdownFiles(path);
    }

    return entry.isFile() && extname(entry.name) === ".md" ? [path] : [];
  });
}

function getLocalTarget(rawTarget, sourcePath) {
  const target = rawTarget.trim().replace(/^<|>$/g, "").split(/\s+["']/)[0];

  if (
    target.length === 0 ||
    target.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:/i.test(target)
  ) {
    return null;
  }

  const pathWithoutAnchor = target.split("#")[0];
  const decodedPath = decodeURIComponent(pathWithoutAnchor);

  return decodedPath.startsWith("/")
    ? resolve(repositoryRoot, `.${decodedPath}`)
    : resolve(dirname(sourcePath), decodedPath);
}

const markdownFiles = [
  ...rootDocuments.map((name) => join(repositoryRoot, name)),
  ...collectMarkdownFiles(documentationRoot),
];
const failures = [];
let checkedLinks = 0;

for (const sourcePath of markdownFiles) {
  if (!existsSync(sourcePath)) {
    failures.push(`${relative(repositoryRoot, sourcePath)} is missing`);
    continue;
  }

  const contents = readFileSync(sourcePath, "utf8");

  for (const match of contents.matchAll(markdownLinkPattern)) {
    const targetPath = getLocalTarget(match[1], sourcePath);

    if (!targetPath) {
      continue;
    }

    checkedLinks += 1;

    if (!existsSync(targetPath)) {
      failures.push(
        `${relative(repositoryRoot, sourcePath)} -> ${match[1]}`
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Documentation link check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Documentation link check passed (${markdownFiles.length} files, ${checkedLinks} local links).`
);
