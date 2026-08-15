import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function createAccount(page: Page) {
  const suffix = crypto.randomUUID();
  await page.goto("/auth");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("Factory test");
  await page.getByLabel("Email").fill(`factory-${suffix}@example.com`);
  await page.getByLabel("Password").fill(`test-${suffix}`);
  await page
    .locator("form")
    .getByRole("button", { name: "Create account", exact: true })
    .click();

  await expect(page.getByRole("heading", { name: "Things to do" })).toBeVisible();
}

async function delayTodoCreation(page: Page, title: string) {
  let releaseCreate = () => {};
  let resolveRequestStarted = () => {};
  let hasDelayedRequest = false;
  const release = new Promise<void>((resolve) => {
    releaseCreate = resolve;
  });
  const requestStarted = new Promise<void>((resolve) => {
    resolveRequestStarted = resolve;
  });
  await page.route("**/*", async (route, request) => {
    if (
      !hasDelayedRequest &&
      request.method() === "POST" &&
      request.postData()?.includes(title)
    ) {
      hasDelayedRequest = true;
      resolveRequestStarted();
      await release;
    }
    await route.continue();
  });

  return {
    requestStarted,
    release: () => releaseCreate(),
  };
}

test("a user can manage todos from a mobile viewport", async ({ page }) => {
  await createAccount(page);
  await page.getByLabel("New todo").fill("Verify the preview");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Verify the preview")).toBeVisible();

  const checkbox = page.getByRole("checkbox");
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await page.getByRole("link", { name: "Active" }).click();
  await expect(page.getByText("Nothing left to do.")).toBeVisible();
  await page.getByRole("link", { name: "Completed" }).click();
  await expect(page.getByText("Verify the preview")).toBeVisible();
});

test("todo creation appears optimistically while the server action is pending", async ({ page }) => {
  await createAccount(page);
  const title = "Ship optimistic creation";
  const createDelay = await delayTodoCreation(page, title);

  await page.getByLabel("New todo").fill(title);
  await page.getByRole("button", { name: "Add" }).click();
  await createDelay.requestStarted;

  const optimisticTodo = page.getByRole("listitem").filter({ hasText: title });
  await expect(optimisticTodo).toBeVisible();
  await expect(optimisticTodo).toHaveAttribute("data-pending", "true");
  await expect(optimisticTodo.getByRole("checkbox")).toBeDisabled();
  await expect(
    optimisticTodo.getByRole("button", { name: `Delete ${title}` }),
  ).toBeDisabled();
  await expect(page.getByText("1 thing left")).toBeVisible();

  createDelay.release();
  await expect(optimisticTodo).toHaveAttribute("data-pending", "false");
});

test("the composer shows the todo title character limit at a 320px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await createAccount(page);

  const input = page.getByLabel("New todo");
  const addButton = page.getByRole("button", { name: "Add" });
  const counter = page.locator("#todo-title-limit");

  await input.fill("x".repeat(89));
  await expect(counter).toHaveCount(0);
  await expect(input).not.toHaveAttribute("aria-describedby", /todo-title-limit/);

  await input.fill("x".repeat(90));
  await expect(counter).toHaveText("30 characters left");
  await expect(counter).toHaveAttribute("aria-live", "polite");
  await expect(counter).toHaveAttribute("aria-atomic", "true");
  await expect(input).toHaveAttribute("aria-describedby", "todo-title-limit");

  await input.fill("x".repeat(119));
  await expect(counter).toHaveText("1 character left");

  await input.fill("x".repeat(120));
  await expect(counter).toHaveText("0 characters left");
  await expect(input).toHaveValue("x".repeat(120));
  await input.press("x");
  await expect(input).toHaveValue("x".repeat(120));
  await expect(counter).toHaveText("0 characters left");

  const inputBox = await input.boundingBox();
  const buttonBox = await addButton.boundingBox();
  expect(inputBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(inputBox!.x).toBeGreaterThanOrEqual(0);
  expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(320);
  expect(buttonBox!.x).toBeGreaterThanOrEqual(0);
  expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(320);
  expect(buttonBox!.y).toBeGreaterThan(inputBox!.y + inputBox!.height);
});
