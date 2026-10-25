import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The dedicated e2e database survives runs; remove only this test's own records,
// including leftovers when a previous browser assertion interrupted cleanup.
for (const hook of [test.beforeEach, test.afterEach]) {
  hook(async ({ request }) => {
    const headers = { Authorization: "Bearer test-only-administrator-token-123456789" };
    const response = await request.get("http://localhost:8000/api/v1/admin/experts", { headers });
    expect(response.ok()).toBe(true);
    for (const row of await response.json()) {
      if (row.name === "Test guidance profile") {
        expect((await request.delete(`http://localhost:8000/api/v1/admin/experts/${row.id}`, { headers })).status()).toBe(204);
      }
    }
  });
}

test("administrator manages persistent experts with public consultation gates", async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/admin/experts");
  await page.getByLabel("Administrator token").fill("test-only-administrator-token-123456789");
  await page.getByRole("button", { name: "Unlock console" }).click();
  await expect(page.getByRole("heading", { name: "Add expert", exact: true })).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("Test guidance profile");
  await page.getByLabel("Areas of expertise").fill("Cybersecurity, Career exploration");
  await page.getByLabel("Contact information").fill("Private test contact");
  await page.getByLabel("Availability", { exact: true }).fill("Saturday by arrangement");
  await page.getByRole("button", { name: "Save expert", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Expert saved to the database.");
  expect((await (await request.get("http://localhost:8000/api/v1/experts")).json())).toEqual([]);
  await page.reload();
  await expect(page.getByLabel("Administrator token")).toHaveValue("");
  await page.getByLabel("Administrator token").fill("test-only-administrator-token-123456789");
  await page.getByRole("button", { name: "Unlock console" }).click();
  await page.getByRole("button", { name: "Edit Test guidance profile" }).click();
  await page.getByLabel("Identity and expertise verified").check();
  await page.getByLabel("Approved for publication").check();
  await page.getByLabel("Visible in public directory").check();
  await page.getByRole("button", { name: "Save expert", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Expert saved to the database.");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const publicPage = await page.context().newPage();
  await publicPage.goto("/experts");
  await expect(publicPage.getByRole("heading", { name: "Test guidance profile" })).toBeVisible();
  await expect(publicPage.getByText("Available for consultation:", { exact: false })).toBeVisible();
  await expect(publicPage.getByText("Private test contact")).toHaveCount(0);
  expect((await new AxeBuilder({ page: publicPage }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Edit Test guidance profile" }).click();
  await page.getByLabel("Demo profile (no real consultations)").check();
  await page.getByRole("button", { name: "Save expert", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Expert saved to the database.");
  await publicPage.reload();
  await expect(publicPage.getByRole("heading", { name: "Test guidance profile — Demo profile" })).toBeVisible();
  await expect(publicPage.getByText("Not available for real consultations", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit Test guidance profile" }).click();
  await page.getByLabel("Active", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save expert", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Expert saved to the database.");
  await publicPage.reload();
  await expect(publicPage.getByText("No approved experts are currently listed.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Remove Test guidance profile" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(page.getByRole("status")).toHaveText("Expert removed.");
  await page.getByRole("button", { name: "Lock console" }).click();
  await expect(page.getByLabel("Administrator token")).toHaveValue("");
});
