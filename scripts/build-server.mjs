import { build } from "esbuild";
import fs from "node:fs/promises";
import { builtinModules } from "node:module";

const outputFile = "dist/index.js";
const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));
const runtimeDependencies = new Set(
  Object.keys(packageJson.dependencies ?? {})
);
const migrationJournal = JSON.parse(
  await fs.readFile("drizzle/meta/_journal.json", "utf8")
);

if (
  !Array.isArray(migrationJournal.entries) ||
  migrationJournal.entries.length === 0
) {
  throw new Error("Database migration journal contains no migrations");
}

for (const migration of migrationJournal.entries) {
  if (typeof migration?.tag !== "string") {
    throw new Error("Database migration journal contains an invalid entry");
  }
  await fs.access(`drizzle/${migration.tag}.sql`);
}

await build({
  entryPoints: ["server/_core/index.ts"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outfile: outputFile,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

const bundle = await fs.readFile(outputFile, "utf8");
const forbiddenRuntimeImports = [
  "@tailwindcss/vite",
  "vite-plugin-manus-runtime",
  'import("vite")',
  "import('vite')",
];
const leakedImport = forbiddenRuntimeImports.find(item =>
  bundle.includes(item)
);

if (leakedImport) {
  throw new Error(
    `Production server bundle contains build-only dependency: ${leakedImport}`
  );
}

const staticImportPattern = /\b(?:from\s*|import\s*)["']([^"']+)["']/g;
const dynamicImportPattern = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const externalSpecifiers = new Set(
  [staticImportPattern, dynamicImportPattern].flatMap(pattern =>
    [...bundle.matchAll(pattern)].map(match => match[1])
  )
);

function getPackageName(specifier) {
  if (specifier.startsWith("@")) {
    return specifier.split("/").slice(0, 2).join("/");
  }

  return specifier.split("/")[0];
}

const undeclaredRuntimeDependencies = [...externalSpecifiers]
  .filter(
    specifier =>
      !specifier.startsWith(".") &&
      !specifier.startsWith("/") &&
      !specifier.startsWith("node:") &&
      !builtinModules.includes(specifier)
  )
  .map(getPackageName)
  .filter(packageName => !runtimeDependencies.has(packageName));

if (undeclaredRuntimeDependencies.length > 0) {
  throw new Error(
    `Production server bundle imports packages outside dependencies: ${[
      ...new Set(undeclaredRuntimeDependencies),
    ].join(", ")}`
  );
}

console.log(
  "Production server bundle only imports declared runtime dependencies"
);
console.log(
  `Validated ${migrationJournal.entries.length} committed database migrations`
);
