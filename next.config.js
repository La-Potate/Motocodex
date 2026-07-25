/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a minimal standalone server bundle for the Docker production image.
  // This ships only compiled code + required node_modules — no readable source.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // Strip all console.* (except error/warn) from client bundles in production
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // Keep server-only packages out of the client bundle.
  // (Renamed from experimental.serverComponentsExternalPackages in Next 15+.)
  serverExternalPackages: ["@prisma/client", "prisma"],
};

module.exports = nextConfig;
