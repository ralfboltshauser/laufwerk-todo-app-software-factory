"use client";

import { useTransition } from "react";
import { deleteTodo, setTodoCompleted } from "@/app/actions";
import type { Todo } from "@/db/schema";

export function TodoItem({
  todo,
  optimistic = false,
}: {
  readonly todo: Todo;
  readonly optimistic?: boolean;
}) {
  const [transitionPending, startTransition] = useTransition();
  const pending = transitionPending || optimistic;

  const remove = () => {
    if (pending) return;
    if (!window.confirm(`Delete “${todo.title}”?`)) return;
    startTransition(() => deleteTodo(todo.id));
  };

  return (
    <li className={todo.completed ? "todo-item completed" : "todo-item"} data-pending={pending}>
      <label className="todo-toggle">
        <input
          type="checkbox"
          checked={todo.completed}
          disabled={pending}
          onChange={(event) => {
            if (pending) return;
            const completed = event.currentTarget.checked;
            startTransition(() => setTodoCompleted(todo.id, completed));
          }}
        />
        <span className="checkmark" aria-hidden="true">✓</span>
        <span className="todo-title">{todo.title}</span>
      </label>
      <button
        type="button"
        className="delete-button"
        onClick={remove}
        disabled={pending}
        aria-label={`Delete ${todo.title}`}
      >
        ×
      </button>
    </li>
  );
}
