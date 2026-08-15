"use client";

import { FormEvent, useState, useTransition } from "react";
import { createTodo } from "@/app/actions";

const TODO_TITLE_MAX_LENGTH = 120;
const TODO_TITLE_LIMIT_VISIBLE_AT = 90;
const TODO_TITLE_LIMIT_ID = "todo-title-limit";
const TODO_ERROR_ID = "todo-error";

export function TodoComposer() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const remainingCharacters = TODO_TITLE_MAX_LENGTH - title.length;
  const showCharacterLimit = title.length >= TODO_TITLE_LIMIT_VISIBLE_AT;
  const describedBy = [
    showCharacterLimit ? TODO_TITLE_LIMIT_ID : undefined,
    error ? TODO_ERROR_ID : undefined,
  ].filter(Boolean).join(" ") || undefined;

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
        maxLength={TODO_TITLE_MAX_LENGTH}
        spellCheck="false"
        autoComplete="off"
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
      />
      <button type="submit" disabled={pending || title.trim().length === 0}>
        {pending ? "Adding…" : "Add"}
      </button>
      {showCharacterLimit && (
        <p
          id={TODO_TITLE_LIMIT_ID}
          className="character-limit"
          aria-live="polite"
          aria-atomic="true"
        >
          {remainingCharacters} {remainingCharacters === 1 ? "character" : "characters"} left
        </p>
      )}
      {error && <p id={TODO_ERROR_ID} className="form-error" role="alert">{error}</p>}
    </form>
  );
}
