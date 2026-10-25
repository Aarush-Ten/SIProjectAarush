"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Compass, GraduationCap, Laptop, LoaderCircle, LockKeyhole, RefreshCw, Search, ShieldCheck, Smartphone, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/profile-provider";
import { getMatches, getSkillCatalog } from "@/lib/api/client";
import { demoProfile, profileSchema, toMatchRequest, type ProfileFormValues } from "@/lib/profile-schema";
import type { SkillCatalog } from "@/lib/types/api";
import { cn, levelLabels } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";
import { SessionLoading } from "@/components/session-notice";

const stepNames = ["Your starting point", "Your real-life constraints", "Your direction"];
const titles = ["A little about your starting point", "Make room for your next step", "What are you working toward?"];
const subtitles = ["Every skill counts. Tell us what you’ve explored so far.", "A useful pathway should work with your life, time, and tools.", "There’s no wrong answer. Your goal can change as you explore."];
const stepFields: FieldPath<ProfileFormValues>[][] = [["education_level", "study_field", "skills", "interests"], ["hours_per_week", "budget_inr", "device_access", "language"]];
const goals = [
  { value: "internship", label: "Find an internship", description: "Get practical experience while learning.", icon: GraduationCap },
  { value: "first_job", label: "Prepare for my first job", description: "Understand the skills a role needs.", icon: BriefcaseBusiness },
  { value: "career_exploration", label: "Explore career directions", description: "See which paths connect with my interests.", icon: Search },
  { value: "upskilling", label: "Build on my current skills", description: "Find a focused direction for learning.", icon: Sparkles },
] as const;

function FieldError({ message, id }: { message?: string; id?: string }) { return message ? <p id={id} className="field-error" role="alert">{message}</p> : null; }

export function OnboardingForm() {
  const { hydrated } = useProfile();
  return hydrated ? <ProfileWizard /> : <SessionLoading />;
}

function ProfileWizard() {
  const { t, language: uiLanguage, setLanguage } = useLanguage();
  const router = useRouter();
  const { formValues, setSession } = useProfile();
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState<SkillCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestController = useRef<AbortController | null>(null);
  const { register, control, watch, setValue, trigger, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: { ...(formValues ?? demoProfile), language: uiLanguage }, mode: "onTouched" });
  const { fields, append, remove } = useFieldArray({ control, name: "skills" });
  const selectedSkills = watch("skills");
  const interests = watch("interests");
  const device = watch("device_access");
  const language = watch("language");
  useEffect(() => { setValue("language", uiLanguage); }, [uiLanguage, setValue]);
  const goal = watch("goal");

  useEffect(() => {
    const controller = new AbortController();
    setCatalogError(null);
    getSkillCatalog(controller.signal).then(setCatalog).catch((error: unknown) => {
      if (!controller.signal.aborted) setCatalogError(error instanceof Error ? error.message : "The skills catalog could not be loaded.");
    });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => { headingRef.current?.focus(); }, [step]);
  useEffect(() => () => requestController.current?.abort(), []);

  async function nextStep() {
    if (await trigger(stepFields[step], { shouldFocus: true })) setStep(step + 1);
  }

  async function submitProfile(values: ProfileFormValues) {
    setRequestError(null);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const request = toMatchRequest(values);
      const results = await getMatches(request, controller.signal);
      setSession(request, values, results);
      router.push("/dashboard");
    } catch (error) {
      if (!controller.signal.aborted) setRequestError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return <div className="wizard-layout" lang={uiLanguage}>
    <aside className="wizard-sidebar"><p className="eyebrow">{t("YOUR NEXT CHAPTER")}</p><h1>{t("Let’s find")}<br />{t("your direction")}<span>{t(".")}</span></h1><p>{t("A few details. A clearer picture of what could come next.")}</p><ol className="wizard-steps" aria-label={t("Profile progress")}>{stepNames.map((name, index) => <li key={name} aria-current={step === index ? "step" : undefined} className={cn(step === index && "current", step > index && "completed")}><span className="step-circle">{step > index ? <Check size={17} aria-label={t("Completed")} /> : `0${index + 1}`}</span><span><small>{t("STEP")} {index + 1}</small>{t(name)}</span></li>)}</ol><div className="privacy-side"><LockKeyhole size={19} /><p>{t("No account. No contact details.")}<br />{t("Saved only on this browser.")}</p></div><p className="demo-note"><span className="status-dot" />{t("Demo values are prefilled.")}<br />{t("Make them your own, or explore as-is.")}</p></aside>
    <section className="wizard-panel" aria-busy={isSubmitting}>
      <div className="wizard-panel-heading"><span className="section-kicker">{t("STEP")} {step + 1} {t("OF 3")}</span><Button variant="ghost" size="small" onClick={() => { reset(demoProfile); setLanguage("en"); setStep(0); setRequestError(null); }} disabled={isSubmitting}><RefreshCw size={14} />{t("Reset demo")}</Button></div>
      <h2 ref={headingRef} tabIndex={-1} className="wizard-title">{t(titles[step])}</h2><p className="wizard-subtitle">{t(subtitles[step])}</p>
      {!catalog && !catalogError && <div className="loading-state" role="status"><LoaderCircle className="spin" size={23} /><p>{t("Loading the curated skills catalog…")}</p></div>}
      {catalogError && <div className="error-box" role="alert"><AlertCircle size={21} /><div><strong>{t("Let’s reconnect to the career service.")}</strong><p>{catalogError}</p><Button variant="secondary" size="small" onClick={() => { setCatalog(null); setAttempt((value) => value + 1); }}>{t("Try again")}<RefreshCw size={14} /></Button></div></div>}
      {catalog && <form onSubmit={(event) => { if (step < 2) { event.preventDefault(); void nextStep(); } else { void handleSubmit(submitProfile)(event); } }} noValidate>
        <fieldset disabled={isSubmitting} className="wizard-fields">
          {step === 0 && <div className="form-step">
            <div className="form-grid"><div className="field"><label htmlFor="education">{t("Education")}</label><select id="education" {...register("education_level")}><option value="school">{t("School")}</option><option value="iti">{t("ITI")}</option><option value="diploma">{t("Diploma / Polytechnic")}</option><option value="undergraduate">{t("Undergraduate")}</option><option value="other">{t("Other")}</option></select><FieldError message={errors.education_level?.message} /></div><div className="field"><label htmlFor="study-field">{t("Study area")}</label><input id="study-field" autoComplete="off" maxLength={100} placeholder={t("e.g. Computer engineering")} aria-invalid={!!errors.study_field} aria-describedby={errors.study_field ? "study-error" : "study-hint"} {...register("study_field")} /><p id="study-hint" className="field-hint">{t("A general subject is enough—no personal details.")}</p><FieldError id="study-error" message={errors.study_field?.message} /></div></div>
            <div className="field"><div className="field-heading"><label>{t("Skills you’ve explored")}</label><span>{t("Choose any that apply")}</span></div><p className="field-hint">{t("Self-report your level. It’s okay to be at the beginning.")}</p><div className="skill-chips" role="group" aria-label={t("Select skills")}>{catalog.skills.map((skill) => { const index = selectedSkills.findIndex((selected) => selected.skill_id === skill.id); const selected = index >= 0; return <button key={skill.id} type="button" className={cn("chip", selected && "selected")} aria-pressed={selected} onClick={() => selected ? remove(index) : append({ skill_id: skill.id, self_reported_level: 1 })}>{selected && <Check size={12} aria-hidden="true" />}{skill.label_en}</button>; })}</div><FieldError message={errors.skills?.message ?? errors.skills?.root?.message} /></div>
            {fields.length > 0 ? <div className="skill-levels"><div className="level-guide">{t("YOUR SELF-REPORTED LEVELS")}<span>{t("0 New · 1 Foundations · 2 Practising · 3 Confident")}</span></div>{fields.map((field, index) => { const skill = catalog.skills.find((item) => item.id === field.skill_id); return <div className="skill-level-row" key={field.id}><div><label htmlFor={`level-${field.skill_id}`}>{skill?.label_en ?? field.skill_id}</label><span>{skill?.description}</span></div><select id={`level-${field.skill_id}`} aria-label={`${skill?.label_en ?? field.skill_id} skill level`} {...register(`skills.${index}.self_reported_level`, { valueAsNumber: true })}>{levelLabels.map((label, value) => <option value={value} key={value}>{value}{t("—")}{t(label)}</option>)}</select><FieldError message={errors.skills?.[index]?.self_reported_level?.message} /></div>; })}</div> : <p className="inline-note">{t("Starting fresh? You can continue with no skills selected. Missing skills will count as level 0.")}</p>}
            <div className="field"><div className="field-heading"><label>{t("What draws your curiosity?")}</label><span>{t("Optional · choose a few")}</span></div><div className="skill-chips" role="group" aria-label={t("Select interests")}>{catalog.interests.map((interest) => <button type="button" className={cn("chip", "interest-chip", interests.includes(interest.id) && "selected")} key={interest.id} aria-pressed={interests.includes(interest.id)} onClick={() => setValue("interests", interests.includes(interest.id) ? interests.filter((id) => id !== interest.id) : [...interests, interest.id], { shouldValidate: true })}>{interests.includes(interest.id) && <Check size={12} aria-hidden="true" />}{interest.label}</button>)}</div><FieldError message={errors.interests?.message} /><p className="field-hint">{t("No interests selected? We use a neutral interest score and label it unknown.")}</p></div>
          </div>}
          {step === 1 && <div className="form-step">
            <div className="form-grid"><div className="field"><label htmlFor="hours">{t("Study hours per week")}</label><div className="input-unit"><input id="hours" type="number" inputMode="numeric" min={1} max={30} step={1} aria-invalid={!!errors.hours_per_week} aria-describedby="hours-hint hours-error" {...register("hours_per_week", { valueAsNumber: true })} /><span>{t("hrs / week")}</span></div><p id="hours-hint" className="field-hint">{t("Choose a realistic number from 1 to 30.")}</p><FieldError id="hours-error" message={errors.hours_per_week?.message} /></div><div className="field"><label htmlFor="budget">{t("Learning budget (INR)")}</label><div className="input-unit"><span className="input-prefix">{t("₹")}</span><input id="budget" type="number" inputMode="decimal" min={0} max={1000000} step="any" aria-invalid={!!errors.budget_inr} aria-describedby="budget-hint budget-error" {...register("budget_inr", { valueAsNumber: true })} /></div><p id="budget-hint" className="field-hint">{t("Zero is welcome. This is your available budget.")}</p><FieldError id="budget-error" message={errors.budget_inr?.message} /></div></div>
            <fieldset className="field"><legend>{t("What device can you access?")}</legend><div className="device-options">{([{ value: "laptop", label: "My own laptop / computer", icon: Laptop }, { value: "shared_computer", label: "A shared computer", icon: Users }, { value: "smartphone_only", label: "Smartphone only", icon: Smartphone }] as const).map(({ value, label, icon: Icon }) => <label key={value} className={cn("choice-card", device === value && "selected")}><input type="radio" value={value} {...register("device_access")} /><Icon size={22} /><span>{t(label)}</span><span className="radio-indicator" /></label>)}</div><FieldError message={errors.device_access?.message} /></fieldset>
            {device === "smartphone_only" && <div className="inline-notice"><Laptop size={19} /><p>{t("A phone is a useful starting point. Some careers need a computer for practical work; those limitations will be clearly flagged.")}</p></div>}
            <div className="field"><label htmlFor="language">{t("Preferred language")}</label><select id="language" {...register("language", { onChange: event => setLanguage(event.target.value === "mr" ? "mr" : "en") })}><option value="en">{t("English")}</option><option value="mr">{t("Marathi / मराठी")}</option></select><p className={cn("field-hint", language === "mr" && "language-notice")}>{t("English fallback: we record your preference. Navigation and this form support initial Marathi translations. Catalogs, descriptions, errors, quizzes and plans remain in English.")}</p></div>
          </div>}
          {step === 2 && <div className="form-step">
            <fieldset className="goal-options"><legend className="sr-only">{t("Your current goal")}</legend>{goals.map(({ value, label, description, icon: Icon }) => <label className={cn("goal-card", goal === value && "selected")} key={value}><input type="radio" value={value} {...register("goal")} /><span className="goal-icon"><Icon size={22} /></span><span><strong>{t(label)}</strong><small>{t(description)}</small></span><span className="radio-indicator" /></label>)}<FieldError message={errors.goal?.message} /></fieldset>
            <div className="consent-card"><div className="consent-title"><ShieldCheck size={21} /><h3>{t("A quick note before we compare")}</h3></div><p>{t("We send this profile to the career service to calculate matches and plans without storing a student profile on the server. This browser saves your profile, plan, and progress so they survive refresh. Anyone sharing the browser may see them; use “Clear saved data” when finished. Don’t add personal details.")}</p><p>{t("Matches use self-reported skills and curated demo requirements. They are suggestions to explore, rather than an employment probability or a guarantee of a job.")}</p><label className="consent-checkbox"><input type="checkbox" aria-describedby="consent-error" {...register("consent")} /><span>{t("I understand how this demo uses and saves my profile and the limits of its recommendations.")}</span></label><FieldError id="consent-error" message={errors.consent?.message} /></div>
          </div>}
        </fieldset>
        {requestError && <div className="error-box submit-error" role="alert"><AlertCircle size={21} /><div><strong>{t("Your profile is still here.")}</strong><p>{requestError}</p><p>{t("Use “Compare my pathways” to retry.")}</p></div></div>}
        <div className="wizard-actions"><Button variant="ghost" onClick={() => { setStep((current) => current - 1); setRequestError(null); }} disabled={step === 0 || isSubmitting}><ArrowLeft size={17} />{t("Back")}</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><LoaderCircle size={18} className="spin" />{t("Comparing your pathways…")}</> : step === 2 ? <>{t("Compare my pathways")}<Compass size={18} /></> : <>{t("Continue")}<ArrowRight size={18} /></>}</Button></div>
        <p className="form-footnote"><LockKeyhole size={13} />{t("Guest mode · No account needed · Saved on this browser")}</p>
      </form>}
      <div className="sr-only" role="status" aria-live="polite">{isSubmitting ? "Calculating your three career matches." : ""}</div>
    </section>
  </div>;
}
