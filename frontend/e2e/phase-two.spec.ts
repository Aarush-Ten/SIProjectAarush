import { expect, test, type Page } from "@playwright/test";
import type { Roadmap, RoadmapRequest } from "../lib/types/api";

const storageKey = "pathforge.session.v2";

async function completeProfile(page: Page, phone = false) {
  await page.goto("/onboarding");
  await expect(page.getByLabel("Python skill level", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  if (phone) {
    await page.getByLabel("Study hours per week", { exact: true }).fill("4");
    await page.getByRole("radio", { name: "Smartphone only", exact: true }).check();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Compare my pathways", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("match-soc-analyst")).toBeVisible();
}

async function openSoc(page: Page) {
  await page.locator('a[href="/careers/soc-analyst"]').first().click();
  await expect(page).toHaveURL(/\/careers\/soc-analyst$/);
  await expect(page.getByRole("heading", { name: "SOC Analyst (junior)", exact: true })).toBeVisible();
  await expect(page.getByTestId("career-comparison")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create my roadmap", exact: true })).toBeEnabled();
}

async function createRoadmap(page: Page) {
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/roadmaps/generate") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create my roadmap", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const plan = await response.json() as Roadmap;
  const input = response.request().postDataJSON() as RoadmapRequest;
  await expect(page).toHaveURL(/\/roadmap$/);
  await expect(page.getByTestId("roadmap-weeks")).toBeVisible();
  return { plan, input };
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

function assertSchedule(plan: Roadmap, hours: number) {
  expect(plan.hours_per_week).toBe(hours);
  expect(plan.estimated_cost_inr).toBe(0);
  expect(plan.estimated_weeks).toBe(plan.weeks.length);
  expect(plan.weeks.reduce((total, week) => total + week.total_hours, 0)).toBe(plan.total_hours);
  const seen = new Set<string>();
  for (const week of plan.weeks) {
    expect(week.total_hours).toBeLessThanOrEqual(hours);
    expect(week.tasks.reduce((sum, task) => sum + task.estimated_hours, 0)).toBe(week.total_hours);
    for (const task of week.tasks) {
      expect(task.prerequisite_task_ids.every((id) => seen.has(id))).toBe(true);
      expect(task.activity.length).toBeGreaterThan(0);
      expect(task.verification.length).toBeGreaterThan(0);
      if (task.resource) {
        expect(task.resource.is_free).toBe(true);
        expect(task.resource.url).toMatch(/^https:\/\//);
      }
      seen.add(task.id);
    }
  }
  expect(plan.weeks.flatMap((week) => week.tasks).some((task) => task.mode === "milestone")).toBe(true);
}

test("profile to career to roadmap persists completion, reopening and clearing", async ({ page }) => {
  test.setTimeout(90_000);
  const started = Date.now();
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await completeProfile(page);
  await openSoc(page);
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/review/career-desktop.png", fullPage: true, animations: "disabled" });
  const { plan } = await createRoadmap(page);
  assertSchedule(plan, 6);
  expect(Date.now() - started).toBeLessThan(180_000);
  await expect(page.getByTestId("completed-task-count")).toHaveText("0");

  for (const week of plan.weeks) {
    await expect(page.getByTestId(`roadmap-week-${week.week_number}`).getByTestId("week-hours")).toHaveText(String(week.total_hours));
  }
  const first = plan.weeks[0].tasks[0];
  const task = page.locator(`[data-task-id="${first.id}"]`);
  await task.getByRole("button", { name: "Mark done", exact: true }).click();
  await expect(page.getByTestId("completed-task-count")).toHaveText("1");
  await expect(page.getByTestId("completed-hours")).toHaveText(String(first.estimated_hours));
  await page.reload();
  await expect(page.getByTestId("completed-task-count")).toHaveText("1");
  await expect(task.getByRole("button", { name: "Reopen task", exact: true })).toBeVisible();
  await task.getByRole("button", { name: "Reopen task", exact: true }).click();
  await expect(page.getByTestId("completed-task-count")).toHaveText("0");
  await expect(page.getByTestId("completed-hours")).toHaveText("0");
  await task.getByRole("button", { name: "Mark done", exact: true }).click();
  await page.goto("/dashboard");
  await expect(page.locator('a[href="/roadmap"]').filter({ hasText: /continue|view|plan/i }).first()).toBeVisible();
  await page.goto("/roadmap");
  await expect(page.getByTestId("completed-task-count")).toHaveText("1");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: "test-results/review/roadmap-desktop.png", animations: "disabled" });
  await page.getByTestId("roadmap-week-1").screenshot({ path: "test-results/review/roadmap-week-desktop.png", animations: "disabled" });

  await page.getByRole("contentinfo").getByRole("button", { name: "Clear saved data", exact: true }).click();
  await page.goto("/roadmap");
  await expect(page.getByRole("heading", { name: "Your learning plan starts with a direction.", exact: true })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your learning plan starts with a direction.", exact: true })).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("phone-only four-hour plan shows theory alternatives and stays within the mobile viewport", async ({ page, request }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await completeProfile(page, true);
  await openSoc(page);
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/review/career375.png", fullPage: true, animations: "disabled" });
  const { plan, input } = await createRoadmap(page);
  assertSchedule(plan, 4);
  const tasks = plan.weeks.flatMap((week) => week.tasks);
  expect(tasks.every((task) => task.device_requirement === "any")).toBe(true);
  expect(tasks.some((task) => task.mode === "theory" && task.alternative)).toBe(true);
  expect(plan.warnings.join(" ")).toMatch(/computer|phone|practical/i);
  await expect(page.getByRole("region", { name: "Practical limitations" })).toContainText(/computer|phone|practical/i);
  await expectNoOverflow(page);
  const laptopResponse = await request.post("http://localhost:8000/api/v1/roadmaps/generate", {
    data: { ...input, profile: { ...input.profile, device_access: "laptop", hours_per_week: 6 } },
  });
  expect(laptopResponse.status()).toBe(200);
  const laptop = await laptopResponse.json() as Roadmap;
  assertSchedule(laptop, 6);
  expect(laptop.estimated_weeks).toBeLessThan(plan.estimated_weeks);
  expect(laptop.weeks.flatMap((week) => week.tasks).some((task) => task.mode === "practical")).toBe(true);
  await page.screenshot({ path: "test-results/review/roadmap375.png", animations: "disabled" });
  await page.getByTestId("roadmap-week-1").screenshot({ path: "test-results/review/roadmap-week375.png", animations: "disabled" });
  await expectNoOverflow(page);
});

test("corrupt saved JSON is reset with an explanation", async ({ page }) => {
  // Seed corruption before React hydration; mutating storage after goto races
  // the provider's initial restore and can consume the warning on the old page.
  await page.addInitScript((key) => localStorage.setItem(key, "{invalid JSON"), storageKey);
  await page.goto("/roadmap");
  await expect(page.getByRole("heading", { name: "Your learning plan starts with a direction.", exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /saved demo could not be read/i })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
});

test("roadmap service failure keeps the profile available for a successful retry", async ({ page }) => {
  await completeProfile(page);
  await openSoc(page);
  await page.route("**/api/v1/roadmaps/generate", (route) => route.request().method() === "POST"
    ? route.fulfill({ status: 503, contentType: "application/json", headers: { "access-control-allow-origin": "http://localhost:3000" }, body: JSON.stringify({ error: { code: "service_unavailable", message: "Planning is temporarily unavailable.", details: [] } }) })
    : route.continue());
  await page.getByRole("button", { name: "Create my roadmap", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Planning is temporarily unavailable.");
  await expect(page).toHaveURL(/\/careers\/soc-analyst$/);
  await page.unroute("**/api/v1/roadmaps/generate");
  await page.getByRole("main").getByRole("alert").getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page).toHaveURL(/\/roadmap$/);
  await expect(page.getByTestId("completed-task-count")).toHaveText("0");
});
