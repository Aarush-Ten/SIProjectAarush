"use client";

import { useState, type FormEvent } from "react";
import { expertInputSchema, getAdminExperts, saveExpert, deleteExpert, type Expert, type ExpertInput } from "@/lib/api/experts";

const empty: ExpertInput = { name: "", bio: "", expertise: [], contact: null, availability: "", verified: false, approved: false, active: true, public_visible: false, public_contact: false, is_demo: false };
const flags = { verified: "Identity and expertise verified", approved: "Approved for publication", active: "Active", public_visible: "Visible in public directory", public_contact: "Publish contact with expert's consent", is_demo: "Demo profile (no real consultations)" } as const;

export default function ExpertAdministration() {
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [draft, setDraft] = useState<ExpertInput>(empty);
  const [areas, setAreas] = useState("");
  const [editing, setEditing] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string>();
  const reset = () => { setDraft({ ...empty }); setAreas(""); setEditing(undefined); };
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed. Try again."); }
    finally { setBusy(false); }
  }
  function unlock(event: FormEvent) {
    event.preventDefault();
    void run(async () => { const rows = await getAdminExperts(token); setExperts(rows); setUnlocked(true); });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = expertInputSchema.safeParse({ ...draft, expertise: areas.split(",").map(value => value.trim()), contact: draft.contact?.trim() || null });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check all fields."); return; }
    void run(async () => {
      const saved = await saveExpert(token, parsed.data, editing);
      setExperts(rows => [...rows.filter(row => row.id !== saved.id), saved]);
      reset(); setMessage("Expert saved to the database.");
    });
  }
  return <main id="main-content" className="container expert-page">
    <h1>Expert administration</h1><p>Manage student guidance experts independently of the CYBERSTARS project team.</p>
    <p>The administrator token stays in this page&apos;s memory. Refresh or lock to clear it. Configure it on the backend; never use a NEXT_PUBLIC variable.</p>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {!unlocked ? <form onSubmit={unlock} className="expert-form">
      <label>Administrator token<input type="password" autoComplete="off" required value={token} onChange={event => setToken(event.target.value)} /></label>
      <button className="button button-primary" disabled={busy}>Unlock console</button>
    </form> : <>
      <button className="button button-secondary" disabled={busy} onClick={() => { setToken(""); setExperts([]); setUnlocked(false); reset(); setError(""); setMessage(""); setRemoving(undefined); }}>Lock console</button>
      <section aria-labelledby="expert-editor"><h2 id="expert-editor">{editing ? "Edit expert" : "Add expert"}</h2>
        <form onSubmit={submit} className="expert-form"><fieldset disabled={busy}>
          <label>Name<input required minLength={2} maxLength={100} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>Biography<textarea maxLength={2000} value={draft.bio} onChange={event => setDraft({ ...draft, bio: event.target.value })} /></label>
          <label>Areas of expertise (comma separated)<input required value={areas} onChange={event => setAreas(event.target.value)} /></label>
          <label>Contact information (private by default)<input maxLength={250} value={draft.contact || ""} onChange={event => setDraft({ ...draft, contact: event.target.value })} /></label>
          <label>Availability<input maxLength={300} value={draft.availability} onChange={event => setDraft({ ...draft, availability: event.target.value })} /></label>
          {Object.entries(flags).map(([key, label]) => <label className="expert-check" key={key}><input type="checkbox" checked={draft[key as keyof typeof flags]} onChange={event => setDraft({ ...draft, [key]: event.target.checked })} />{label}</label>)}
          <p>Publish only with consent and actual verification. Real consultations require active, visible, verified, approved, non-demo status and availability. Demo records are always labeled.</p>
          <div className="expert-actions"><button className="button button-primary">Save expert</button><button type="button" className="button button-secondary" onClick={reset}>Clear editor</button></div>
        </fieldset></form>
      </section>
      <section aria-labelledby="expert-records"><h2 id="expert-records">Saved experts</h2>{!experts.length && <p>No experts have been added.</p>}
        {experts.map(expert => <article className="expert-card" key={expert.id}>
          <h3>{expert.name}{expert.is_demo ? " — Demo" : ""}</h3><p>{expert.expertise.join(", ")}</p>
          <p>{expert.active ? "Active" : "Inactive"} · {expert.verified ? "Verified" : "Unverified"} · {expert.approved ? "Approved" : "Not approved"} · {expert.public_visible ? "Visibility enabled" : "Hidden"}</p>
          <div className="expert-actions"><button className="button button-secondary" disabled={busy} onClick={() => { const { id, ...value } = expert; setEditing(id); setDraft(value); setAreas(value.expertise.join(", ")); setRemoving(undefined); document.getElementById("expert-editor")?.scrollIntoView(); }}>Edit {expert.name}</button>
          <button className="button button-secondary" disabled={busy} onClick={() => setRemoving(expert.id)}>Remove {expert.name}</button></div>
          {removing === expert.id && <div><p>Permanently remove {expert.name}? To retain the record, edit it and uncheck Active instead.</p><button className="button button-primary" disabled={busy} onClick={() => void run(async () => { await deleteExpert(token, expert.id); setExperts(rows => rows.filter(row => row.id !== expert.id)); if (editing === expert.id) reset(); setRemoving(undefined); setMessage("Expert removed."); })}>Confirm removal</button><button className="button button-secondary" disabled={busy} onClick={() => setRemoving(undefined)}>Cancel</button></div>}
        </article>)}
      </section>
    </>}
  </main>;
}
