import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TodoComposer } from "@/components/todo-composer";
import { TodoItem } from "@/components/todo-item";
import { SignOutButton } from "@/components/sign-out-button";
import { db } from "@/db/client";
import { todo } from "@/db/schema";
import { auth } from "@/lib/auth";

type Filter = "all" | "active" | "completed";

export default async function Home({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ filter?: string | string[] }>;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const params = await searchParams;
  const filter: Filter =
    params.filter === "active" || params.filter === "completed"
      ? params.filter
      : "all";

  const todos = await db
    .select()
    .from(todo)
    .where(eq(todo.userId, session.user.id))
    .orderBy(desc(todo.createdAt));
  const visibleTodos = todos.filter((item) =>
    filter === "all"
      ? true
      : filter === "completed"
        ? item.completed
        : !item.completed,
  );
  const remaining = todos.filter((item) => !item.completed).length;

  return (
    <main className="page-shell" id="main-content">
      <section className="todo-app" aria-labelledby="page-title">
        <header className="app-header">
          <div>
            <p className="eyebrow">Today</p>
            <h1 id="page-title">Things to do</h1>
          </div>
          <SignOutButton name={session.user.name} />
        </header>

        <TodoComposer />

        <div className="list-heading" aria-live="polite">
          <p>{remaining === 1 ? "1 thing left" : `${remaining} things left`}</p>
        </div>

        {visibleTodos.length > 0 ? (
          <ul className="todo-list">
            {visibleTodos.map((item) => (
              <TodoItem key={item.id} todo={item} />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <p>
              {filter === "completed"
                ? "Nothing completed yet."
                : filter === "active"
                  ? "Nothing left to do."
                  : "Your list is clear. Add the first thing on your mind."}
            </p>
          </div>
        )}

        <nav className="filters" aria-label="Filter todos">
          {(["all", "active", "completed"] as const).map((value) => (
            <Link
              key={value}
              href={value === "all" ? "/" : `/?filter=${value}`}
              className={filter === value ? "filter active" : "filter"}
              aria-current={filter === value ? "page" : undefined}
            >
              {value[0]?.toUpperCase()}{value.slice(1)}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
