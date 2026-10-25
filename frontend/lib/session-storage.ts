import { z } from "zod";
import { matchesSchema, roadmapSchema } from "@/lib/api/schemas";
import { profileSchema, toMatchRequest, type ProfileFormValues } from "@/lib/profile-schema";
import type { MatchRequest, MatchesResponse, Roadmap, RoadmapTask } from "@/lib/types/api";

export const SESSION_STORAGE_KEY = "pathforge.session.v2";
export const SESSION_VERSION = 2;
const MAX_SESSION_BYTES = 2_000_000;

export interface SessionData {
  profile: MatchRequest | null;
  formValues: ProfileFormValues | null;
  results: MatchesResponse | null;
  selectedCareerSlug: string | null;
  roadmap: Roadmap | null;
  roadmapRequest: MatchRequest | null;
  completedTaskIds: string[];
}
export const emptySession = (): SessionData => ({ profile: null, formValues: null, results: null, selectedCareerSlug: null, roadmap: null, roadmapRequest: null, completedTaskIds: [] });
const requestSchema = z.object({
  profile: profileSchema.omit({ skills: true, interests: true, consent: true }),
  skills: profileSchema.shape.skills,
  interests: profileSchema.shape.interests,
});
const storedSchema = z.object({
  version: z.literal(SESSION_VERSION),
  profile: requestSchema.nullable(), formValues: profileSchema.nullable(), results: matchesSchema.nullable(),
  selectedCareerSlug: z.string().regex(/^[a-z0-9-]+$/).max(160).nullable(),
  roadmap: roadmapSchema.nullable(), roadmapRequest: requestSchema.nullable(), completedTaskIds: z.array(z.string().max(160)).max(10000),
});

export function profileKey(request: MatchRequest): string {
  return JSON.stringify({
    profile: Object.fromEntries(Object.entries(request.profile).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
    skills: [...request.skills].sort((a, b) => a.skill_id < b.skill_id ? -1 : a.skill_id > b.skill_id ? 1 : 0),
    interests: [...request.interests].sort(),
  });
}
export function sameProfile(a: MatchRequest | null, b: MatchRequest | null): boolean {
  return a !== null && b !== null && profileKey(a) === profileKey(b);
}
export function allTasks(roadmap: Roadmap): RoadmapTask[] { return roadmap.weeks.flatMap((week) => week.tasks); }

export function validCompletedTaskIds(roadmap: Roadmap, ids: string[]): string[] {
  const requested = new Set(ids);
  const valid = new Set<string>();
  // Tasks are validated in prerequisite order. A cached completion cannot skip
  // a missing prerequisite or refer to a task from a different plan.
  for (const task of allTasks(roadmap)) if (requested.has(task.id) && task.prerequisite_task_ids.every((id) => valid.has(id))) valid.add(task.id);
  return [...valid];
}
export function toggleTaskCompletion(roadmap: Roadmap, ids: string[], taskId: string): string[] {
  const current = new Set(validCompletedTaskIds(roadmap, ids));
  const task = allTasks(roadmap).find((item) => item.id === taskId);
  if (!task) return [...current];
  if (current.has(taskId)) current.delete(taskId);
  else if (task.prerequisite_task_ids.every((id) => current.has(id))) current.add(taskId);
  return validCompletedTaskIds(roadmap, [...current]);
}
export function roadmapProgress(roadmap: Roadmap, ids: string[]) {
  const tasks = allTasks(roadmap);
  const completed = new Set(validCompletedTaskIds(roadmap, ids));
  const completedHours = tasks.reduce((hours, task) => hours + (completed.has(task.id) ? task.estimated_hours : 0), 0);
  const totalHours = tasks.reduce((hours, task) => hours + task.estimated_hours, 0);
  return { completedTasks: completed.size, totalTasks: tasks.length, completedHours, totalHours, percent: totalHours ? Math.round(completedHours / totalHours * 10000) / 100 : 0 };
}

export function parseStoredSession(raw: string): SessionData {
  if (raw.length > MAX_SESSION_BYTES) throw new Error("Saved session is too large.");
  const parsed = storedSchema.parse(JSON.parse(raw));
  const { version: _version, ...session } = parsed;
  if (!session.profile || !session.formValues || !session.results) {
    if (session.profile || session.formValues || session.results || session.roadmap) throw new Error("Saved profile is incomplete.");
    return emptySession();
  }
  if (!sameProfile(session.profile, toMatchRequest(session.formValues))) throw new Error("Saved profile snapshots differ.");
  if (session.roadmap) {
    if (!sameProfile(session.profile, session.roadmapRequest) || session.roadmap.hours_per_week !== session.profile.profile.hours_per_week || session.roadmap.estimated_cost_inr > session.profile.profile.budget_inr) {
      session.roadmap = null;
      session.roadmapRequest = null;
      session.completedTaskIds = [];
    } else session.completedTaskIds = validCompletedTaskIds(session.roadmap, session.completedTaskIds);
  } else { session.roadmapRequest = null; session.completedTaskIds = []; }
  return session;
}

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export function loadSession(storage: StorageLike | null): { data: SessionData; notice: string | null; available: boolean } {
  if (!storage) return { data: emptySession(), available: false, notice: "Browser storage is unavailable. You can continue in memory; refreshing will clear this visit’s progress." };
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return { data: emptySession(), notice: null, available: true };
    try { return { data: parseStoredSession(raw), notice: null, available: true }; }
    catch {
      storage.removeItem(SESSION_STORAGE_KEY);
      return { data: emptySession(), available: true, notice: "The saved demo could not be read and was reset. Start a new profile to continue." };
    }
  } catch { return { data: emptySession(), available: false, notice: "Browser storage is unavailable. You can continue in memory; refreshing will clear this visit’s progress." }; }
}
export function saveSession(storage: StorageLike | null, session: SessionData): boolean {
  try {
    if (!storage) return false;
    if (!session.profile) storage.removeItem(SESSION_STORAGE_KEY);
    else storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ version: SESSION_VERSION, ...session }));
    return true;
  } catch { return false; }
}

export function updateProfileSession(current: SessionData, profile: MatchRequest, formValues: ProfileFormValues, results: MatchesResponse): SessionData {
  const preservePlan = sameProfile(current.profile, profile);
  return {
    profile, formValues, results,
    selectedCareerSlug: preservePlan ? current.selectedCareerSlug : results.matches[0].career.slug,
    roadmap: preservePlan ? current.roadmap : null,
    roadmapRequest: preservePlan ? current.roadmapRequest : null,
    completedTaskIds: preservePlan ? current.completedTaskIds : [],
  };
}
