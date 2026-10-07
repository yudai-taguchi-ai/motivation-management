"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import DayView from "@/components/DayView";
import LoginView from "@/components/LoginView";
import { fetchAllDays, saveDay, supabase } from "@/lib/cloud";
import { clearLegacy, readLegacyRecords } from "@/lib/legacy";
import { mergeRecords, recordOf, type DayRecord, type Days } from "@/lib/records";

export type SaveStatus = "idle" | "saving" | "error";

export default function AppRoot() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <p className="center-note">読み込み中…</p>;
  if (session === null) return <LoginView />;
  return <SignedIn key={session.user.id} email={session.user.email ?? ""} />;
}

function SignedIn({ email }: { email: string }) {
  const [days, setDays] = useState<Days | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [legacy, setLegacy] = useState(readLegacyRecords);
  const [migrating, setMigrating] = useState(false);
  const [version, setVersion] = useState(0);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    let alive = true;
    fetchAllDays()
      .then((list) => alive && setDays(new Map(list.map((r) => [r.date, r]))))
      .catch(() => alive && setLoadError(true));
    return () => {
      alive = false;
    };
  }, []);

  function save(record: DayRecord) {
    setDays((prev) => new Map(prev).set(record.date, record));
    setStatus("saving");
    // 保存の順番が入れ替わらないよう、1件ずつ順に送る
    queue.current = queue.current
      .then(() => saveDay(record))
      .then(() => setStatus("idle"))
      .catch(() => setStatus("error"));
  }

  async function migrate() {
    if (!days) return;
    setMigrating(true);
    try {
      const next = new Map(days);
      for (const local of legacy) {
        const merged = mergeRecords(recordOf(next, local.date), local);
        await saveDay(merged);
        next.set(merged.date, merged);
      }
      clearLegacy();
      setDays(next);
      setLegacy([]);
      setVersion((v) => v + 1);
    } catch {
      setStatus("error");
    } finally {
      setMigrating(false);
    }
  }

  if (loadError) {
    return <p className="center-note">記録を読み込めませんでした。通信を確認して、ページを開き直してください。</p>;
  }
  if (!days) return <p className="center-note">記録を読み込み中…</p>;

  return (
    <>
      {legacy.length > 0 && (
        <div className="banner">
          <p>このブラウザに、クラウドに移す前の記録が {legacy.length} 日分あります。</p>
          <button className="primary" onClick={migrate} disabled={migrating}>
            {migrating ? "移しています…" : "クラウドに移す"}
          </button>
        </div>
      )}
      <DayView key={version} days={days} status={status} onSave={save} />
      <footer className="footer">
        <span>{email}</span>
        <button className="link-button" onClick={() => supabase.auth.signOut()}>
          ログアウト
        </button>
      </footer>
    </>
  );
}
