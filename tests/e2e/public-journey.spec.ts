import { expect, test } from "@playwright/test";

test("institutional entry is responsive and routes to events", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Education.*With purpose/i })).toBeVisible();
  const explore = page.getByRole("link", { name: "Explore G Events" });
  await expect(explore).toBeVisible();
  await expect(explore).toHaveAttribute("href", "/events");
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("manifest uses the approved PWA identity", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.name).toBe("Gatik Events");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: "192x192" }),
    expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
  ]));
});
