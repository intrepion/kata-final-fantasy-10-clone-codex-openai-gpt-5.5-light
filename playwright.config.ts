import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  timeout: 30_000,
  workers: 1,
  expect: {
    timeout: 5_000
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:44173",
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 0.5,
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run build && npm run bundle:direct && npx vite preview --host 127.0.0.1 --port 44173",
    url: "http://127.0.0.1:44173",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
