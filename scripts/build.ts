import { $ } from "bun";
import { mkdirSync, writeFileSync, renameSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parseArgs } from "util";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    target: { type: "string" },
    output: { type: "string", default: "repolens" },
  },
});

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

const buildDir = join(tmpdir(), `repolens-build-${Date.now()}`);
mkdirSync(buildDir, { recursive: true });
const outpath = join(buildDir, "repolens");

const root = process.cwd();
const entry = join(root, "src/index.tsx");
const targetArgs = values.target ? ["--target", values.target] : [];

await $`bun build --compile ${targetArgs} ${entry} --outfile ${outpath}`.cwd(
  buildDir
);

const isDarwinTarget = values.target
  ? values.target.includes("darwin")
  : process.platform === "darwin";

if (isDarwinTarget && process.platform === "darwin") {
  await $`codesign --remove-signature ${outpath}`.quiet().nothrow();
  await $`codesign --sign - ${outpath}`;
}

renameSync(outpath, values.output!);
rmSync(buildDir, { recursive: true, force: true });

console.log(`Build complete: ./${values.output}`);
