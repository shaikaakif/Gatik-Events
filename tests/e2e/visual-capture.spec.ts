import { test } from "@playwright/test";

test("capture institutional homepage at required widths", async ({ page }) => {
  test.skip(process.env.CAPTURE_VISUALS !== "1", "Run explicitly for visual review artifacts.");
  for (const width of [360, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await page.goto("/");
    await page.screenshot({ path: `docs/screenshots/home-${width}.png`, fullPage: true });
  }
});
