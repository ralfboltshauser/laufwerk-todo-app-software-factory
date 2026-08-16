"use client";

import { useOptimistic } from "react";
import { createTodo } from "@/app/actions";
import { TodoComposer } from "@/components/todo-composer";
import { TodoItem } from "@/components/todo-item";
import type { TodoActionResult } from "@/app/actions";
import type { Todo } from "@/db/schema";

type Filter = "all" | "active" | "completed";
type OptimisticTodo = Todo & { readonly optimistic?: true };
type PendingTodo = {
  readonly id: string;
  readonly title: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export function TodoList({
  todos,
  filter,
}: {
  readonly todos: readonly Todo[];
  readonly filter: Filter;
}) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic<
    readonly OptimisticTodo[],
    PendingTodo
  >(todos, (currentTodos, pendingTodo) => [
    {
      ...pendingTodo,
      userId: "",
      completed: false,
      optimistic: true,
    },
    ...currentTodos,
  ]);

  const visibleTodos = optimisticTodos.filter((item) =>
    filter === "all"
      ? true
      : filter === "completed"
        ? item.completed
        : !item.completed,
  );
  const remaining = optimisticTodos.filter((item) => !item.completed).length;

  const create = async (title: string): Promise<TodoActionResult> => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 0) {
      const now = new Date();
      addOptimisticTodo({
        id: `optimistic-${crypto.randomUUID()}`,
        title: trimmedTitle,
        createdAt: now,
        updatedAt: now,
      });
    }
    return createTodo(title);
  };

  return (
    <>
      <TodoComposer onCreate={create} />

      <div className="list-heading" aria-live="polite">
        <p>{remaining === 1 ? "1 thing left" : `${remaining} things left`}</p>
      </div>

      {visibleTodos.length > 0 ? (
        <ul className="todo-list">
          {visibleTodos.map((item) => (
            <TodoItem
              key={item.id}
              todo={item}
              optimistic={item.optimistic}
            />
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
    </>
  );
}
