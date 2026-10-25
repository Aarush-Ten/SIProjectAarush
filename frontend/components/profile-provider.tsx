"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MatchRequest, MatchesResponse, Roadmap } from "@/lib/types/api";
import type { ProfileFormValues } from "@/lib/profile-schema";
import { emptySession, loadSession, sameProfile, saveSession, SESSION_STORAGE_KEY, toggleTaskCompletion, updateProfileSession, type SessionData } from "@/lib/session-storage";

interface SessionState extends SessionData {
  hydrated: boolean;
  storageAvailable: boolean;
  storageNotice: string | null;
  setSession: (profile: MatchRequest, formValues: ProfileFormValues, results: MatchesResponse) => void;
  selectCareer: (slug: string) => void;
  setRoadmap: (roadmap: Roadmap, request: MatchRequest) => void;
  toggleTask: (taskId: string) => void;
  clearSavedData: () => void;
}

const ProfileContext = createContext<SessionState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [session, setData] = useState<SessionData>(emptySession);
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const browserStorage = () => { try { return window.localStorage; } catch { return null; } };

  useEffect(() => {
    const saved = loadSession(browserStorage());
    setData(saved.data);
    setStorageAvailable(saved.available);
    setStorageNotice(saved.notice);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    if (!saveSession(browserStorage(), session)) {
      setStorageAvailable(false);
      setStorageNotice("Your changes are kept in memory only because browser storage is unavailable. Refreshing may lose this visit’s progress.");
    }
  }, [session, hydrated]);

  function clearSavedData() {
    setData(emptySession());
    window.dispatchEvent(new Event("pathforge:clear"));
    try {
      const storage = browserStorage();
      if (!storage) throw new Error("Storage unavailable");
      storage.removeItem(SESSION_STORAGE_KEY);
      storage.removeItem("pathforge.quiz-evidence.v1");
      storage.removeItem("pathforge.language.v1");
      setStorageNotice("Your saved profile, plan, and progress have been cleared from this browser.");
      setStorageAvailable(true);
    } catch {
      setStorageNotice("Your profile and progress have been cleared from this visit. Browser storage is blocked, so previously saved browser data could not be removed.");
      setStorageAvailable(false);
    }
  }
  return <ProfileContext.Provider value={{ ...session, hydrated, storageAvailable, storageNotice,
    setSession: (profile, formValues, results) => setData((current) => updateProfileSession(current, profile, formValues, results)),
    selectCareer: (selectedCareerSlug) => setData((current) => ({ ...current, selectedCareerSlug })),
    setRoadmap: (roadmap, request) => setData((current) => sameProfile(current.profile, request) ? ({ ...current, roadmap, roadmapRequest: request, selectedCareerSlug: roadmap.career_slug, completedTaskIds: [] }) : current),
    toggleTask: (taskId) => setData((current) => current.roadmap ? { ...current, completedTaskIds: toggleTaskCompletion(current.roadmap, current.completedTaskIds, taskId) } : current),
    clearSavedData,
  }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used inside ProfileProvider.");
  return context;
}
