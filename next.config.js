/** @type {import('next').NextConfig} */

// Two build targets from one codebase:
//   default        -> "standalone" Node server for the Docker image
//   BUILD_TARGET=export -> fully static site for GitHub Pages
// GitHub Pages serves a project repo from https://<user>.github.io/<repo>/, so
// every asset needs that prefix; set NEXT_PUBLIC_BASE_PATH=/<repo>. Leave it
// empty for a user/org page (<user>.github.io) or a custom domain.
const isExport = process.env.BUILD_TARGET === "export";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

const nextConfig = {
  output: isExport ? "export" : "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  ...(isExport
    ? {
        basePath: basePath || undefined,
        assetPrefix: basePath || undefined,
        // Pages has no rewrite layer, so emit /path/index.html directories.
        trailingSlash: true,
        // The Image Optimization API needs a server; ship the files as-is.
        images: { unoptimized: true },
      }
    : {}),

  compiler: {
    // Strip all console.* (except error/warn) from client bundles in production
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // Keep server-only packages out of the client bundle.
  // (Renamed from experimental.serverComponentsExternalPackages in Next 15+.)
  serverExternalPackages: ["@prisma/client", "prisma"],
};

module.exports = nextConfig;
