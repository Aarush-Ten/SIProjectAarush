import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fixture from "../tests/fixtures/phase2-session.json" with { type: "json" };

test("practice assessment grades on the server and preserves only advisory badges", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/assessments");
  await page.getByRole("button", { name: "Web basics", exact: true }).click();
  await expect(page.getByRole("button", { name: "Submit answers" })).toBeDisabled();
  for (const answer of ["Structuring web content", "button", "Presentation and layout", "To provide an accessible name and improve usability", "On the server as well"]) {
    await page.getByRole("radio", { name: answer, exact: true }).check();
  }
  const request = page.waitForRequest(request => request.url().endsWith("/web-basics/grade"));
  await page.getByRole("button", { name: "Submit answers" }).click();
  expect(Object.keys((await request).postDataJSON())).toEqual(["answers"]);
  await expect(page.getByRole("heading", { name: "Your score: 5 / 5" })).toBeVisible();
  await expect(page.getByText("Quiz-completed badge earned.", { exact: false })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your quiz-completed badges" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pathforge.quiz-evidence.v1"))).not.toContain("answer");
  await page.getByRole("contentinfo").getByRole("button", { name: "Clear saved data" }).click();
  await expect(page.getByRole("heading", { name: "Your quiz-completed badges" })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("pathforge.quiz-evidence.v1"))).toBeNull();
});

test("Marathi navigation and onboarding switch language without resetting entered values", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/onboarding");
  await page.getByRole("combobox", { name: "Interface language" }).selectOption("mr");
  await expect(page.getByRole("link", { name: "माझे करिअर मार्ग", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "तुमच्या सुरुवातीबद्दल थोडेसे" })).toBeVisible();
  await page.getByLabel("अभ्यासाचे क्षेत्र", { exact: true }).fill("Computer engineering");
  await page.getByRole("button", { name: "पुढे", exact: true }).click();
  await expect(page.getByLabel("पसंतीची भाषा", { exact: true })).toHaveValue("mr");
  await page.getByLabel("आठवड्यातील अभ्यासाचे तास", { exact: true }).fill("4");
  await page.getByRole("combobox", { name: "Interface language" }).selectOption("en");
  await expect(page.getByLabel("Study hours per week")).toHaveValue("4");
  await page.getByRole("combobox", { name: "Interface language" }).selectOption("mr");
  await expect(page.getByLabel("आठवड्यातील अभ्यासाचे तास", { exact: true })).toHaveValue("4");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "पुढे", exact: true }).click();
  await page.getByRole("checkbox", { name: /माझी माहिती/ }).check();
  await page.getByRole("button", { name: "माझ्या मार्गांची तुलना करा", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pathforge.session.v2")!).profile.profile.language)).toBe("mr");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Interface language" })).toHaveValue("mr");
  await expect(page.getByText("English fallback: career catalogs", { exact: false })).toBeVisible();
});

test("optional wording uses rules without a key and never changes plan or scores", async ({ page }) => {
  await page.addInitScript(data => localStorage.setItem("pathforge.session.v2", JSON.stringify(data)), fixture);
  await page.goto("/roadmap");
  await expect(page.getByTestId("roadmap-weeks")).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem("pathforge.session.v2"));
  await page.getByRole("button", { name: "Show rules-based guidance" }).click();
  await expect(page.getByText("Rules-based fallback", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pathforge.session.v2"))).toBe(before);
  await page.getByRole("checkbox", { name: /Allow an AI provider/ }).check();
  await page.getByRole("button", { name: "Request optional AI wording" }).click();
  await expect(page.getByText("Rules-based fallback", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pathforge.session.v2"))).toBe(before);
});
