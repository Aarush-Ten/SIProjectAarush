"use client";
import { useEffect, useRef, useState } from "react";
import { getWording } from "@/lib/api/phase3";
import { useProfile } from "@/components/profile-provider";
import { profileKey } from "@/lib/session-storage";

export function OptionalWording({ slug }: { slug: string }) {
  const { profile } = useProfile();
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof getWording>> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const key = profile ? profileKey(profile) : "";
  useEffect(() => { revision.current++; setResult(null); setConsent(false); setError(""); }, [key, slug]);
  if (!profile) return null;
  async function load() {
    if (!profile) return;
    const current = revision.current; setBusy(true); setError("");
    try { const value = await getWording(profile, slug, consent); if (current === revision.current) setResult(value); }
    catch (cause) { if (current === revision.current) setError(cause instanceof Error ? cause.message : "Wording unavailable. Your original plan is unchanged."); }
    finally { setBusy(false); }
  }
  return <section className="card phase3-panel" aria-labelledby="wording-heading" lang="en"><h2 id="wording-heading">Optional learning guidance</h2><p>The calculated scores, hours, prerequisites and resource links remain authoritative. English fallback applies to this panel. The preview covers up to six initial tasks.</p>
    <label className="expert-check"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} />Allow an AI provider to receive my selected skill IDs, goal and learning constraints for optional wording. My study-area text and personal details are excluded.</label>
    <button className="button button-secondary" disabled={busy} onClick={() => void load()}>{busy ? "Preparing guidance…" : consent ? "Request optional AI wording" : "Show rules-based guidance"}</button>
    {error && <p role="alert">{error}</p>}{result && <div role="status"><p><strong>{result.source === "llm" ? "AI wording — validated structure" : "Rules-based fallback"}</strong></p><p>{result.explanation}</p><p>{result.notice}</p>{result.tasks.map((task, index) => <p key={task.task_id}>Task {index + 1}: {task.wording}</p>)}</div>}
  </section>;
}
