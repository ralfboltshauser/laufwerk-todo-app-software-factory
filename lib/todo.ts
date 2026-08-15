export type TodoTitleResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: string };

export const normalizeTodoTitle = (title: string): TodoTitleResult => {
  const value = title.trim();
  if (value.length === 0) {
    return { ok: false, error: "Write something before adding a todo." };
  }
  if (value.length > 120) {
    return { ok: false, error: "Keep the todo under 120 characters." };
  }
  return { ok: true, value };
};
