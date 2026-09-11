import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext (Cloudflare) config — the recommended path for Next.js on Pages.
// The /api/pdf and /api/shopping-pdf routes use @react-pdf/renderer which needs
// Node APIs, so they run on OpenNext's Node-compat layer rather than pure Edge.
export default defineCloudflareConfig({
  // No overrides needed for the MVP — default caching and Node-compat apply.
});