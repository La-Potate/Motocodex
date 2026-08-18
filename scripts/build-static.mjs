/**
 * Build the fully static site for GitHub Pages.
 *
 * Two things in this app cannot exist in a static export, because both need a
 * server at request time:
 *   - src/proxy.ts        (middleware)
 *   - src/app/api/*       (route handlers, one of which reads searchParams)
 * They are moved aside for the export build and restored afterwards, so the
 * Docker/standalone target keeps working unchanged.
 *
 * Usage: npm run build:static
 *   NEXT_PUBLIC_BASE_PATH=/<repo>  path prefix for a GitHub project page
 *   SITE_URL=https://<user>.github.io/<repo>   canonical + sitemap origin
 */
import { renameSync, existsSync, writeFileSync, rmSync, readdirSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);

const root = process.cwd();
// `_`-prefixed folders are private in the App Router, so Next ignores them.
const moves = [
  [join(root, "src/app/api"), join(root, "src/app/_api.disabled")],
  [join(root, "src/proxy.ts"), join(root, "src/proxy.ts.disabled")],
];

function shift(dir) {
  for (const [live, parked] of moves) {
    const [from, to] = dir === "out" ? [live, parked] : [parked, live];
    if (existsSync(from)) renameSync(from, to);
  }
}

// Recover from a previous interrupted run before starting.
shift("in");

let failed = null;
try {
  console.log("→ generating search index");
  execFileSync(process.execPath, ["scripts/build-search-index.mjs"], { stdio: "inherit" });

  console.log("→ parking server-only routes");
  shift("out");

  // Next caches generated route-type validators that still reference the parked
  // API routes, which fails the type check. Start the export build from clean.
  rmSync(join(root, ".next"), { recursive: true, force: true });
  rmSync(join(root, "out"), { recursive: true, force: true });

  console.log("→ next build (static export)");
  // Resolve Next's JS entry and run it on this Node binary. Going through npx
  // would mean spawning next.cmd on Windows, which Node refuses without a
  // shell; this path behaves identically on Windows and on Linux CI.
  execFileSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "export" },
  });
} catch (err) {
  failed = err;
} finally {
  console.log("→ restoring server-only routes");
  shift("in");
}

if (failed) {
  console.error("\nStatic build failed.");
  process.exit(1);
}

/**
 * Next 16 writes each RSC prefetch payload to a DIRECTORY —
 *   find-your-bike/__next.find-your-bike/__PAGE__.txt
 * but requests it as a FLAT file —
 *   find-your-bike/__next.find-your-bike.__PAGE__.txt
 * A static host serves literal paths, so every prefetch 404s and each link
 * click falls back to a full page load. Emit the flat name alongside it.
 */
function flattenRscPayloads(dir) {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name.startsWith("__next.")) {
      // The payload can sit several levels deep (one level per dynamic
      // segment); the requested filename dot-joins every segment.
      const walk = (cur, segs) => {
        for (const child of readdirSync(cur, { withFileTypes: true })) {
          const childPath = join(cur, child.name);
          if (child.isDirectory()) walk(childPath, [...segs, child.name]);
          else {
            copyFileSync(childPath, join(dir, [...segs, child.name].join(".")));
            n++;
          }
        }
      };
      walk(full, [entry.name]);
    } else {
      n += flattenRscPayloads(full);
    }
  }
  return n;
}

// Pages runs Jekyll by default, which silently drops _next/ (underscore = private).
const out = join(root, "out");
writeFileSync(join(out, ".nojekyll"), "");
console.log(`→ flattened ${flattenRscPayloads(out)} RSC prefetch payloads`);
// A 404 that Pages will serve for unknown paths.
if (existsSync(join(out, "404.html"))) {
  console.log("→ 404.html present");
}
writeFileSync(join(out, ".nojekyll"), "");
console.log("\nStatic site written to out/");
