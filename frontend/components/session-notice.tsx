"use client";

import { Info, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/components/profile-provider";
import { Button } from "@/components/ui/button";

export function SessionNotice() {
  const { storageNotice, profile, hydrated, storageAvailable, clearSavedData } = useProfile();
  const router = useRouter();
  if (!hydrated || (!storageNotice && !profile)) return null;
  return <div className="container storage-notice"><Info size={18} /><p role="status">{storageNotice ?? (storageAvailable ? "Your demo profile and progress are saved on this browser. Clear them when using a shared device." : "Your demo is kept in memory only. Refreshing may lose this visit’s progress.")}</p>{profile && <Button variant="ghost" size="small" onClick={() => { clearSavedData(); router.push("/"); }}><Trash2 size={15} /> Clear saved data</Button>}</div>;
}

export function SessionLoading() {
  return <div className="loading-state" role="status"><LoaderCircle className="spin" size={24} /><p>Restoring your saved starting point…</p></div>;
}
