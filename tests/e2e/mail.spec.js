const { test, expect } = require("@playwright/test");

async function login(page) {
  await page.goto("/");
  await page.locator('input[name="_user"]').fill(process.env.CBS_E2E_USERNAME || "test@example.test");
  await page.locator('input[name="_pass"]').fill("test");
  await page.locator('button[type="submit"], input[type="submit"]').click();
  await expect(page.locator("body.task-mail")).toBeVisible();
  await expect(page.locator("#messagelist tr").filter({ has: page.locator("td") }).first()).toBeVisible();
}

async function expectNoPageOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("mail shell stays inside the viewport", async ({ page }, testInfo) => {
  await login(page);
  await expectNoPageOverflow(page);

  const visiblePanes = await page.locator("#layout-menu, #layout-sidebar, #layout-list, #layout-content").evaluateAll((nodes) =>
    nodes.filter((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }).length
  );
  expect(visiblePanes).toBeGreaterThan(0);

  if (testInfo.project.name.startsWith("mobile")) {
    await expect(page.locator("body")).not.toHaveClass(/cybrense-mobile-(menu|sidebar)-open/);
    const menuRight = await page.locator("#layout-menu").evaluate((node) => node.getBoundingClientRect().right);
    expect(menuRight).toBeLessThanOrEqual(0);

    const firstDate = page.locator("#messagelist tr.cybrense-row-enhanced span.cybrense-row-date").first();
    if (await firstDate.count()) {
      await expect(firstDate).toBeVisible();
    }
  }
});

test("PWA metadata and safe offline fallback are available", async ({ request }) => {
  const manifestResponse = await request.get("/cybrense-manifest.json");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("Cybrense Mail");
  expect(manifest.display).toBe("standalone");

  const offlineResponse = await request.get("/offline.html");
  expect(offlineResponse.ok()).toBeTruthy();
  const offline = await offlineResponse.text();
  expect(offline).toContain("Aucun contenu de vos courriels n'est conserve hors ligne");

  const workerResponse = await request.get("/cybrense-sw.js");
  expect(workerResponse.ok()).toBeTruthy();
  const worker = await workerResponse.text();
  expect(worker).toContain("never written to Cache Storage");
  expect(worker).not.toMatch(/cache\.put\s*\(\s*event\.request/);
});

test("browser notifications are configurable in Roundcube settings", async ({ page }) => {
  await login(page);
  await page.goto("/?_task=settings&_action=preferences");
  await expect(page.locator("body.task-settings")).toBeVisible();
  await page.locator("#rcmrowmailbox").click();

  const preferences = page.frameLocator("#preferences-frame");
  await expect(preferences.locator("#_newmail_notifier_desktop")).toBeAttached();
  await expect(preferences.locator("#_newmail_notifier_sound")).toBeAttached();
  await expectNoPageOverflow(page);
});

test("one label click persists without browser storage", async ({ page }, testInfo) => {
  await login(page);

  const row = page.locator("#messagelist tr").filter({ has: page.locator("td") }).first();
  await row.click();

  if (testInfo.project.name.startsWith("mobile")) {
    await expect(page.locator("#message-header")).toBeVisible();
  } else {
    await row.dblclick();
    await expect(page.locator("#message-header")).toBeVisible();
  }

  const projectLabel = page.locator('.cybrense-message-label-chip[data-label-id="projects"]');
  await expect(projectLabel).toBeVisible();

  const wasAssigned = await projectLabel.getAttribute("aria-pressed") === "true";
  const saveResponse = page.waitForResponse((response) =>
    response.url().includes("plugin.cybrense_labels_save") && response.request().method() === "POST"
  );
  await projectLabel.click();
  await saveResponse;
  await expect(projectLabel).toHaveAttribute("aria-pressed", wasAssigned ? "false" : "true");

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.cybrense-message-label-chip[data-label-id="projects"]')).toHaveAttribute(
    "aria-pressed",
    wasAssigned ? "false" : "true"
  );
  await expectNoPageOverflow(page);
});

test("a mobile email tap opens the full message route", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "Mobile-only interaction");

  await login(page);

  const row = page.locator("#messagelist tr").filter({ has: page.locator("td") }).first();
  const uid = await row.getAttribute("id");
  const navigation = page.waitForURL(/_action=show/);

  await row.click();
  await navigation;

  await expect(page.locator("body.task-mail.action-show")).toBeVisible();
  await expect(page.locator("#message-header")).toBeVisible();
  expect(page.url()).toContain("_uid=");
  expect(uid).toMatch(/^rcmrow/);
  await expectNoPageOverflow(page);
});
