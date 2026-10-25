import { describe, expect, it } from "vitest";
import fixture from "./fixtures/phase2-session.json";
import { isTrustedResourceUrl, roadmapSchema } from "@/lib/api/schemas";
import { allTasks, emptySession, loadSession, parseStoredSession, profileKey, roadmapProgress, saveSession, SESSION_STORAGE_KEY, toggleTaskCompletion, updateProfileSession, validCompletedTaskIds, type StorageLike } from "@/lib/session-storage";

function session() { return parseStoredSession(JSON.stringify(fixture)); }
function storage(initial: string | null = null): StorageLike {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; }, removeItem: () => { value = null; } };
}

describe("validated local guest persistence", () => {
  it("round-trips the actual backend plan and preserves its exact scores", () => {
    const data = session();
    const local = storage();
    expect(saveSession(local, data)).toBe(true);
    const restored = loadSession(local);
    expect(restored.available).toBe(true);
    expect(restored.data).toEqual(data);
    expect(data.roadmap?.total_hours).toBe(21);
    expect(data.results?.matches[0].fit_score).toBe(47.07);
  });
  it.each(["{broken", JSON.stringify({ ...fixture, version: 999 }), "x".repeat(2_000_001)])("resets corrupt, incompatible or oversized state", (raw) => {
    const local = storage(raw);
    const result = loadSession(local);
    expect(result.data).toEqual(emptySession());
    expect(result.notice).toMatch(/reset/);
    expect(local.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
  it("rejects an incomplete or inconsistent stored profile", () => {
    expect(() => parseStoredSession(JSON.stringify({ ...fixture, formValues: null }))).toThrow();
    const changed = structuredClone(fixture);
    changed.formValues.hours_per_week = 3;
    expect(() => parseStoredSession(JSON.stringify(changed))).toThrow(/snapshots differ/);
  });
  it("falls back to memory if reading or writing browser storage is blocked", () => {
    const blocked: StorageLike = { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Full"); }, removeItem() { throw new Error("Blocked"); } };
    expect(loadSession(blocked)).toMatchObject({ data: emptySession(), available: false });
    expect(loadSession(null).available).toBe(false);
    expect(saveSession(blocked, session())).toBe(false);
    expect(saveSession(null, session())).toBe(false);
  });
  it("clears the stored record for an empty journey", () => {
    const local = storage(JSON.stringify(fixture));
    expect(saveSession(local, emptySession())).toBe(true);
    expect(local.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
  it("invalidates an old plan while retaining a valid changed profile", () => {
    const changed = structuredClone(fixture);
    changed.profile.profile.hours_per_week = 4;
    changed.formValues.hours_per_week = 4;
    const restored = parseStoredSession(JSON.stringify(changed));
    expect(restored.profile?.profile.hours_per_week).toBe(4);
    expect(restored.roadmap).toBeNull();
    expect(restored.completedTaskIds).toEqual([]);
  });
  it("preserves a plan for equivalent input ordering and drops it for changed constraints", () => {
    const current = session();
    const profile = structuredClone(current.profile!);
    profile.skills.reverse(); profile.interests.reverse();
    expect(profileKey(profile)).toBe(profileKey(current.profile!));
    expect(updateProfileSession(current, profile, current.formValues!, current.results!).roadmap).toEqual(current.roadmap);
    profile.profile.device_access = "smartphone_only";
    const next = updateProfileSession(current, profile, { ...current.formValues!, device_access: "smartphone_only" }, current.results!);
    expect(next.roadmap).toBeNull();
  });
});

describe("self-reported task progress", () => {
  it("counts allocated hours and task IDs, and never changes skill scores", () => {
    const data = session();
    const before = structuredClone(data.results);
    const task = allTasks(data.roadmap!)[0];
    const ids = toggleTaskCompletion(data.roadmap!, [], task.id);
    const progress = roadmapProgress(data.roadmap!, ids);
    expect(progress.completedTasks).toBe(1);
    expect(progress.completedHours).toBe(task.estimated_hours);
    expect(progress.percent).toBe(Math.round(task.estimated_hours / 21 * 10000) / 100);
    expect(data.results).toEqual(before);
    expect(toggleTaskCompletion(data.roadmap!, ids, task.id)).toEqual([]);
  });
  it("prevents skipped prerequisites and reopens transitive dependents", () => {
    const plan = session().roadmap!;
    const tasks = allTasks(plan);
    const dependent = tasks.find((task) => task.prerequisite_task_ids.length > 0)!;
    expect(toggleTaskCompletion(plan, [], dependent.id)).toEqual([]);
    const all = validCompletedTaskIds(plan, tasks.map((task) => task.id));
    expect(roadmapProgress(plan, all).percent).toBe(100);
    const prerequisite = dependent.prerequisite_task_ids[0];
    const reopened = toggleTaskCompletion(plan, all, prerequisite);
    expect(reopened).not.toContain(prerequisite);
    expect(reopened).not.toContain(dependent.id);
    expect(roadmapProgress(plan, reopened).percent).toBeLessThan(100);
  });
  it("filters unknown and duplicated completion IDs on restore", () => {
    const data = session();
    const first = allTasks(data.roadmap!)[0].id;
    const stored = { ...fixture, completedTaskIds: [first, first, "not-in-plan"] };
    expect(parseStoredSession(JSON.stringify(stored)).completedTaskIds).toEqual([first]);
  });
});

describe("untrusted cached plans", () => {
  it.each(["javascript:alert(1)", "https://example.com/learn", "https://docs.python.org.attacker.example/a", "https://user:password@docs.python.org/3/", "http://docs.python.org/3/", "https://docs.python.org:444/3/"])("rejects unsafe resource URL %s", (url) => {
    expect(isTrustedResourceUrl(url)).toBe(false);
    const changed = structuredClone(fixture);
    const task = changed.roadmap.weeks.flatMap((week) => week.tasks).find((task) => task.resource)!;
    task.resource!.url = url;
    expect(() => parseStoredSession(JSON.stringify(changed))).toThrow();
  });
  it("rejects altered weekly totals, duplicate IDs and dependency cycles", () => {
    const plan = structuredClone(fixture.roadmap);
    plan.weeks[0].total_hours = 30;
    expect(roadmapSchema.safeParse(plan).success).toBe(false);
    const cyclic = structuredClone(fixture.roadmap);
    cyclic.weeks[0].tasks[0].prerequisite_task_ids = [cyclic.weeks[0].tasks[0].id];
    expect(roadmapSchema.safeParse(cyclic).success).toBe(false);
    const duplicate = structuredClone(fixture.roadmap);
    duplicate.weeks[0].tasks[1].id = duplicate.weeks[0].tasks[0].id;
    expect(roadmapSchema.safeParse(duplicate).success).toBe(false);
  });
});
