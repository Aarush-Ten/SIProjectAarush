import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testDir: "./recording",
  testMatch: "walkthrough.recording.ts",
  timeout: 260_000,
  retries: 0,
  use: { ...base.use, viewport: { width: 1280, height: 720 }, video: { mode: "on", size: { width: 1280, height: 720 } } },
});
