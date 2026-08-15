import { describe, expect, test } from "bun:test";
import { normalizeTodoTitle } from "@/lib/todo";

describe("normalizeTodoTitle", () => {
  test("trims a valid title", () => {
    expect(normalizeTodoTitle("  Ship it  ")).toEqual({
      ok: true,
      value: "Ship it",
    });
  });

  test("rejects empty and oversized titles", () => {
    expect(normalizeTodoTitle("  ")).toEqual({
      ok: false,
      error: "Write something before adding a todo.",
    });
    expect(normalizeTodoTitle("x".repeat(121))).toEqual({
      ok: false,
      error: "Keep the todo under 120 characters.",
    });
  });
});
