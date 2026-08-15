"use client";

import { FormEvent, useState, useTransition } from "react";
import { createTodo } from "@/app/actions";

export function TodoComposer() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await createTodo(title);
      if (result.ok) setTitle("");
      else setError(result.error);
    });
  };

  return (
    <form className="todo-composer" onSubmit={submit}>
      <label htmlFor="todo-title" className="visually-hidden">New todo</label>
      <input
        id="todo-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs doing?"
        maxLength={120}
        spellCheck="false"
        autoComplete="off"
        aria-describedby={error ? "todo-error" : undefined}
        aria-invalid={Boolean(error)}
      />
      <button type="submit" disabled={pending || title.trim().length === 0}>
        {pending ? "Adding…" : "Add"}
      </button>
      {error && <p id="todo-error" className="form-error" role="alert">{error}</p>}
    </form>
  );
}
