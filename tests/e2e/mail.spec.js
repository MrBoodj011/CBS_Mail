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

test("mail shell stays inside the viewport", async ({ page }) => {
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
