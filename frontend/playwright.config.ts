import { randomUUID } from "node:crypto";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const frontendURL = "http://localhost:3000";
const backendURL = "http://localhost:8000";
// A unique directory ensures cleanup only targets processes from this run.
process.env.PATHFORGE_E2E_STATE_DIR ??= path.resolve(
  "node_modules/.cache/pathforge-e2e", randomUUID(),
);

// Run `npm run build` first. Both services are owned and stopped by Playwright.
export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: frontendURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PLAYWRIGHT_CHANNEL
          ? { channel: process.env.PLAYWRIGHT_CHANNEL }
          : {}),
      },
    },
  ],
  webServer: [
    {
      command: "node e2e/start-backend.mjs",
      url: `${backendURL}/api/v1/health`,
      env: {
        DATABASE_URL: "sqlite:///./pathforge-e2e.db",
        ADMIN_TOKEN: "test-only-administrator-token-123456789",
        CORS_ORIGINS: JSON.stringify([new URL(frontendURL).origin]),
      },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "node e2e/start-frontend.mjs",
      url: frontendURL,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
