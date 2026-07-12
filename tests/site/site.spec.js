const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders the product and core landing content", async ({ page }) => {
  await expect(
    page.getByRole("heading", { level: 1, name: "CBS Mail" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Roundcube, repens/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Lancez CBS Mail avec Docker/ }),
  ).toBeVisible();

  const heroImage = page.locator(".product-stage img");
  await expect(heroImage).toBeVisible();
  await expect
    .poll(() => heroImage.evaluate((image) => image.naturalWidth))
    .toBeGreaterThan(0);
});

test("does not create horizontal page overflow", async ({ page }) => {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
});

test("keeps the navigation usable", async ({ page, isMobile }) => {
  const navigation = page.locator("#main-navigation");

  if (isMobile) {
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(
      navigation.getByRole("link", { name: "Installation" }),
    ).toBeVisible();
  } else {
    await expect(
      navigation.getByRole("link", { name: "Installation" }),
    ).toBeVisible();
  }
});
