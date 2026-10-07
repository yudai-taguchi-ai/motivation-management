"use client";

import { useState } from "react";
import { supabase } from "@/lib/cloud";

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "メールアドレスかパスワードが違います",
};

function toJapanese(message: string): string {
  return MESSAGES[message] ?? `うまくいきませんでした（${message}）`;
}

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(toJapanese(error.message));
  }

  return (
    <main className="login">
      <h1>調子</h1>
      <form className="form" onSubmit={submit}>
        <input
          className="text-input"
          type="email"
          autoComplete="email"
          placeholder="メールアドレス"
          aria-label="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="text-input"
          type="password"
          autoComplete="current-password"
          placeholder="パスワード"
          aria-label="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="primary" disabled={busy}>
            ログイン
          </button>
        </div>
      </form>
    </main>
  );
}
