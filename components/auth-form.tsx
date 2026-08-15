"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");

    const result = mode === "sign-in"
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ email, password, name });

    if (result.error) {
      setError(result.error.message ?? "Authentication failed. Try again.");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="auth-form-wrap">
      <div className="mode-switch" role="group" aria-label="Authentication mode">
        <button
          type="button"
          className={mode === "sign-in" ? "active" : ""}
          onClick={() => { setMode("sign-in"); setError(undefined); }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "sign-up" ? "active" : ""}
          onClick={() => { setMode("sign-up"); setError(undefined); }}
        >
          Create account
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === "sign-up" && (
          <label>
            Name
            <input name="name" type="text" autoComplete="name" required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={pending}>
          {pending
            ? mode === "sign-in" ? "Signing in…" : "Creating account…"
            : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
