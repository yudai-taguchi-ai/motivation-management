"use client";

import { useState } from "react";
import { supabase } from "@/lib/cloud";

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "メールアドレスかパスワードが違います",
  "User already registered": "このメールアドレスはすでに登録されています",
  "Signups not allowed for this instance": "新規登録は締め切っています",
};

function toJapanese(message: string): string {
  if (message.includes("Password should be at least")) return "パスワードは8文字以上にしてください";
  return MESSAGES[message] ?? `うまくいきませんでした（${message}）`;
}

export default function LoginView() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
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
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="パスワード（8文字以上）"
          aria-label="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="primary" disabled={busy}>
            {mode === "signin" ? "ログイン" : "登録してはじめる"}
          </button>
        </div>
      </form>
      <button
        className="link-button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
      >
        {mode === "signin" ? "はじめて使う（新規登録）" : "登録済みの人はこちら（ログイン）"}
      </button>
    </main>
  );
}
