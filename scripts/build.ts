import { $ } from "bun";
import { mkdirSync, writeFileSync, renameSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Shim react-devtools-core — Ink optionally imports it for DEV mode,
// but the bundler resolves the import statically.
mkdirSync("node_modules/react-devtools-core", { recursive: true });
writeFileSync(
  "node_modules/react-devtools-core/package.json",
  JSON.stringify({
    name: "react-devtools-core",
    main: "index.js",
    type: "module",
  })
);
writeFileSync(
  "node_modules/react-devtools-core/index.js",
  "export default { connectToDevTools() {} };\n"
);

// Build into a temp directory to avoid .bun-build artifacts in the project root.
const buildDir = join(tmpdir(), `repolens-build-${Date.now()}`);
mkdirSync(buildDir, { recursive: true });
const outpath = join(buildDir, "repolens");

const root = process.cwd();
await $`bun build --compile ${join(root, "src/index.tsx")} --outfile ${outpath}`.cwd(buildDir);

if (process.platform === "darwin") {
  await $`codesign --remove-signature ${outpath}`.quiet().nothrow();
  await $`codesign --sign - ${outpath}`;
}

renameSync(outpath, "repolens");
rmSync(buildDir, { recursive: true, force: true });

console.log("Build complete: ./repolens");
