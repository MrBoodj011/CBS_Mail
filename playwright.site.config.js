const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/site",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: process.env.CI ? "github" : "list",
  webServer: {
    command: "node scripts/serve-site.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "site-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "site-tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 834, height: 1194 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "site-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
