import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { auth } from "@/lib/auth";

export default async function AuthPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="mark" aria-hidden="true">L</div>
        <p className="eyebrow">Laufwerk factory sample</p>
        <h1 id="auth-title">A quieter way to remember.</h1>
        <p className="auth-intro">
          A deliberately small Todo app, built to test autonomous software delivery.
        </p>
        <AuthForm />
      </section>
    </main>
  );
}
