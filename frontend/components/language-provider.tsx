"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGUAGE_KEY, translate, type Language } from "@/lib/i18n";
import { useProfile } from "@/components/profile-provider";

const Context = createContext<{ language: Language; setLanguage: (value: Language) => void; t: (text: string) => string } | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setValue] = useState<Language>("en");
  const { hydrated, formValues } = useProfile();
  useEffect(() => {
    if (!hydrated) return;
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      setValue(saved === "mr" ? "mr" : saved === "en" ? "en" : formValues?.language ?? "en");
    } catch { /* retain the current in-memory choice */ }
  }, [hydrated, formValues?.language]);
  useEffect(() => {
    const clear = () => { setValue("en"); };
    window.addEventListener("pathforge:clear", clear);
    return () => window.removeEventListener("pathforge:clear", clear);
  }, []);
  function setLanguage(value: Language) {
    setValue(value);
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch { /* language remains usable in memory */ }
  }
  return <Context.Provider value={{ language, setLanguage, t: text => translate(text, language) }}>{children}{language === "mr" && <aside className="container language-fallback" aria-label="Translation coverage" lang="mr">मराठी: मुख्य नेव्हिगेशन आणि प्रोफाइल फॉर्म. <span lang="en">English fallback: career catalogs, skill descriptions, validation errors, quizzes, roadmaps, AI wording and administration remain in English. Marathi wording is an initial translation and needs native-speaker review.</span></aside>}</Context.Provider>;
}
export function useLanguage() { const value = useContext(Context); if (!value) throw new Error("LanguageProvider is required"); return value; }
