import { expect, test, type Page } from "@playwright/test";
import type { MatchesResponse } from "../lib/types/api";

async function reviewScreenshot(page: Page, filename: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  await page.screenshot({ path: filename, fullPage: true, animations: "disabled" });
}

async function openGoalStep(page: Page, options: { screenshot?: string; exerciseConstraints?: boolean } = {}) {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "A little about your starting point" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.getByLabel("Python skill level", { exact: true })).toBeVisible();
  if (options.screenshot) await reviewScreenshot(page, options.screenshot);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Make room for your next step" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  if (options.exerciseConstraints) {
    await page.getByLabel("Study hours per week", { exact: true }).fill("31");
    await page.getByLabel("Learning budget (INR)", { exact: true }).fill("-1");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText("Choose no more than 30 hours per week.", { exact: true })).toBeVisible();
    await expect(page.getByText("Your budget cannot be negative.", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Make room for your next step" })).toBeVisible();
    await page.getByLabel("Study hours per week", { exact: true }).fill("4");
    await page.getByLabel("Learning budget (INR)", { exact: true }).fill("0");
    await page.getByRole("radio", { name: "Smartphone only", exact: true }).check();
    await expect(page.getByText("A phone is a useful starting point.", { exact: false })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What are you working toward?" })).toBeVisible();
  await page.getByRole("checkbox").check();
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test("demo onboarding renders three matches with the API's exact scores and gaps", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/");
  await reviewScreenshot(page, "test-results/review/landing-desktop.png");
  await openGoalStep(page);
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/matches") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Compare my pathways", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const payload = await response.json() as MatchesResponse;
  expect(payload.matches).toHaveLength(3);
  const socMatch = payload.matches.find((match) => match.career.slug === "soc-analyst");
  expect(socMatch, "the illustrative cybersecurity demo includes SOC Analyst").toBeDefined();
  for (const skillId of ["networking", "linux"]) {
    expect(socMatch?.missing_skills.find((gap) => gap.skill_id === skillId)).toMatchObject({
      user_level: 0, required_level: 2, missing_level: 2, importance: "essential",
    });
  }

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your next direction starts here" })).toBeVisible();
  const cards = page.getByRole("article", { name: /recommendation$/ });
  await expect(cards).toHaveCount(3);

  for (const [index, match] of payload.matches.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute("data-testid", `match-${match.career.slug}`);
    const scores = [
      ["fit-score", match.fit_score],
      ["coverage-score", match.coverage],
      ["interest-score", match.interest_match],
      ["feasibility-score", match.feasibility.score],
    ] as const;
    for (const [id, expected] of scores) {
      const displayed = Number.parseFloat(await card.getByTestId(id).innerText());
      expect(displayed, `${match.career.title}: ${id}`).toBe(expected);
    }
    await card.getByRole("button").click();
    const detail = page.getByTestId("career-detail");
    await expect(detail.getByRole("heading", { name: match.career.title, exact: true })).toBeVisible();
    await detail.locator("details summary").click();
    for (const gap of match.missing_skills) {
      const row = detail.getByTestId(`gap-${gap.skill_id}`);
      await expect(row).toBeVisible();
      await expect(row).toContainText(gap.label);
      await expect(row.getByTestId("gap-user-level")).toHaveText(String(gap.user_level));
      await expect(row.getByTestId("gap-required-level")).toHaveText(String(gap.required_level));
      await expect(row.getByTestId("gap-missing-level")).toHaveText(String(gap.missing_level));
    }
    // Keep the next selection's optional section in its default closed state.
    await detail.locator("details summary").click();
  }
  expect(browserErrors).toEqual([]);
  await cards.first().getByRole("button").click();
  await reviewScreenshot(page, "test-results/review/dashboard-desktop.png");
});

test("375px layout fits the viewport and keyboard focus is visible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Find my pathway", exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
  const hasVisibleFocus = await focused.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return (style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0)
      || style.boxShadow !== "none";
  });
  expect(hasVisibleFocus).toBe(true);

  await openGoalStep(page, { screenshot: "test-results/review/onboarding375.png", exerciseConstraints: true });
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Compare my pathways", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("article", { name: /recommendation$/ })).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
  await reviewScreenshot(page, "test-results/review/dashboard375.png");
  await page.reload();
  await expect(page.getByRole("article", { name: /recommendation$/ })).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Your next direction starts here" })).toBeVisible();
  await page.getByRole("contentinfo").getByRole("button", { name: "Clear saved data", exact: true }).click();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your pathway starts with a profile.", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: /recommendation$/ })).toHaveCount(0);
});

test("fresh dashboard explains how to get recommendations", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Your pathway starts with a profile.", exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Find my pathway", exact: true })).toHaveAttribute("href", "/onboarding");
  await expect(page.getByRole("article", { name: /recommendation$/ })).toHaveCount(0);
  const response = await page.goto("/unknown-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "That page isn’t on this pathway.", exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Back to my pathways", exact: true })).toHaveAttribute("href", "/dashboard");
});

test("a catalog failure offers a meaningful retry state", async ({ page }) => {
  await page.route("**/api/v1/catalog/skills", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "http://localhost:3000" },
    body: JSON.stringify({ error: { code: "service_unavailable", message: "The catalog is temporarily unavailable.", details: [] } }),
  }));
  await page.goto("/onboarding");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("The catalog is temporarily unavailable.");
  const retry = page.getByRole("button", { name: /try again|retry/i });
  await expect(retry).toBeVisible();
  await page.unroute("**/api/v1/catalog/skills");
  await retry.click();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
  await expect(page.getByLabel("Education", { exact: true })).toHaveValue("diploma");
});

test("a matching failure keeps the profile available for retry", async ({ page }) => {
  await openGoalStep(page);
  await page.route("**/api/v1/matches", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "http://localhost:3000" },
      body: JSON.stringify({ error: { code: "service_unavailable", message: "Matching is temporarily unavailable.", details: [] } }),
    });
  });
  await page.getByRole("button", { name: "Compare my pathways", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Matching is temporarily unavailable.");
  await expect(page.getByRole("checkbox")).toBeChecked();
  await expect(page.getByRole("button", { name: "Compare my pathways", exact: true })).toBeEnabled();
  await page.unroute("**/api/v1/matches");
  await page.getByRole("button", { name: "Compare my pathways", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("article", { name: /recommendation$/ })).toHaveCount(3);
});
