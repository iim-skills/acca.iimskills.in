/* scripts/remove-console.cjs */

const fg = require("fast-glob");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = process.cwd();

// Folders to scan
const SCAN_DIRS = ["src", "app", "components", "lib", "utils"];

// File types
const FILE_TYPES = ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"];

// Ignore folders
const IGNORE = ["node_modules", ".next", "dist", "build"];

// Regex to match console.log (multi-line safe)
const CONSOLE_LOG_REGEX =
  /console\.log\s*\(([\s\S]*?)\);?/g;

async function getFiles() {
  let allFiles = [];

  for (const dir of SCAN_DIRS) {
    const fullPath = path.join(ROOT_DIR, dir);

    if (!fs.existsSync(fullPath)) continue;

    const files = await fg(FILE_TYPES, {
      cwd: fullPath,
      absolute: true,
      ignore: IGNORE.map((i) => `**/${i}/**`),
    });

    allFiles.push(...files);
  }

  return allFiles;
}

function cleanFile(filePath) {
  const original = fs.readFileSync(filePath, "utf-8");

  const updated = original.replace(CONSOLE_LOG_REGEX, "");

  if (original !== updated) {
    fs.writeFileSync(filePath, updated, "utf-8");
    return true;
  }

  return false;
}

// MAIN
(async function () {
  console.log("🔍 Scanning project...\n");

  const files = await getFiles();

  let changedCount = 0;

  files.forEach((file) => {
    const changed = cleanFile(file);
    if (changed) {
      console.log("🧹 Cleaned:", file.replace(ROOT_DIR, ""));
      changedCount++;
    }
  });

  console.log("\n✅ Done!");
  console.log(`🧾 Files scanned: ${files.length}`);
  console.log(`🧹 Files cleaned: ${changedCount}`);
})();