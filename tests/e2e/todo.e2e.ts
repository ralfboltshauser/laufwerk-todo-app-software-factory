import { expect, test } from "@playwright/test";

test("a user can manage todos from a mobile viewport", async ({ page }) => {
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
