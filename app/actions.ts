"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { todo } from "@/db/schema";
import { auth } from "@/lib/auth";
import { normalizeTodoTitle } from "@/lib/todo";

export type TodoActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

const currentUserId = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("You must be signed in.");
  return session.user.id;
};

export const createTodo = async (title: string): Promise<TodoActionResult> => {
  const parsed = normalizeTodoTitle(title);
  if (!parsed.ok) return parsed;

  const userId = await currentUserId();
  await db.insert(todo).values({
    id: crypto.randomUUID(),
    userId,
    title: parsed.value,
  });
  revalidatePath("/");
  return { ok: true };
};

export const setTodoCompleted = async (
  id: string,
  completed: boolean,
): Promise<void> => {
  const userId = await currentUserId();
  await db
    .update(todo)
    .set({ completed })
    .where(and(eq(todo.id, id), eq(todo.userId, userId)));
  revalidatePath("/");
};

export const deleteTodo = async (id: string): Promise<void> => {
  const userId = await currentUserId();
  await db.delete(todo).where(and(eq(todo.id, id), eq(todo.userId, userId)));
  revalidatePath("/");
};
