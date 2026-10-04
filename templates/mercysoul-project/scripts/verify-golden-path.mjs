import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "README.md",
  "GOLDEN_PATH.md",
  ".env.example",
  "docs/ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/OPERATIONS.md",
  "docs/ADMISSION.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
const goldenPath = fs.existsSync(path.join(root, "GOLDEN_PATH.md"))
  ? fs.readFileSync(path.join(root, "GOLDEN_PATH.md"), "utf8")
  : "";

const forbiddenSecretPatterns = [
  /(?:sk|pk|api[_-]?key|secret|token)[_-]?[A-Za-z0-9]{20,}/i,
];

const trackedFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else trackedFiles.push(full);
  }
}
walk(root);

const secretFindings = [];
for (const file of trackedFiles) {
  if (file.endsWith(".env.local") || file.endsWith(".env")) continue;
  try {
    const content = fs.readFileSync(file, "utf8");
    if (forbiddenSecretPatterns.some((re) => re.test(content))) {
      secretFindings.push(path.relative(root, file));
    }
  } catch {}
}

const failures = [];
if (missing.length) failures.push("Missing required files: " + missing.join(", "));
if (!/^golden_path_version:\s*1\.0/m.test(goldenPath)) failures.push("Golden Path v1.0 declaration missing.");
if (!/^source_of_truth:\s*github/m.test(goldenPath)) failures.push("GitHub source-of-truth declaration missing.");
if (!/^deployment:\s*vercel/m.test(goldenPath)) failures.push("Vercel deployment declaration missing.");
if (!/^persistence:\s*supabase/m.test(goldenPath)) failures.push("Supabase persistence declaration missing.");
if (secretFindings.length) failures.push("Possible committed secrets detected in: " + secretFindings.join(", "));

if (failures.length) {
  console.error("GOLDEN PATH CHECK: FAIL");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("GOLDEN PATH CHECK: PASS");
