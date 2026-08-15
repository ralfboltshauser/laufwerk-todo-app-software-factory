"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ name }: { readonly name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className="account-button"
      disabled={pending}
      title={`Signed in as ${name}`}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push("/auth");
        router.refresh();
      }}
    >
      {pending ? "Leaving…" : "Sign out"}
    </button>
  );
}
