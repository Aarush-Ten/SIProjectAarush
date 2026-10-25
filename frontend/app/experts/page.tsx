"use client";
import { useEffect, useState } from "react";
import { getPublicExperts } from "@/lib/api/experts";

export default function ExpertDirectory() {
  const [experts, setExperts] = useState<Awaited<ReturnType<typeof getPublicExperts>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  function load() {
    setLoading(true); setError("");
    getPublicExperts().then(setExperts).catch(cause => setError(cause instanceof Error ? cause.message : "Could not load experts.")).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);
  return <main id="main-content" className="container expert-page"><h1>Career guidance experts</h1>
    <p>Only active, verified and approved profiles are published here. Demo profiles cannot provide real consultations. Availability is maintained by an administrator; this directory does not book appointments.</p>
    {loading && <p role="status">Loading experts…</p>}{error && <div role="alert"><p>{error}</p><button className="button button-secondary" onClick={load}>Try again</button></div>}
    {!loading && !error && !experts.length && <p>No approved experts are currently listed. You can continue exploring careers and learning plans.</p>}
    {!loading && !error && experts.map(expert => <article key={expert.id} className="expert-card"><h2>{expert.name}{expert.is_demo ? " — Demo profile" : ""}</h2><p>{expert.bio}</p><p>Expertise: {expert.expertise.join(", ")}</p><p>{expert.consultation_available ? `Available for consultation: ${expert.availability}` : "Not available for real consultations"}</p>{expert.contact && <p>Contact: {expert.contact}</p>}</article>)}
  </main>;
}
