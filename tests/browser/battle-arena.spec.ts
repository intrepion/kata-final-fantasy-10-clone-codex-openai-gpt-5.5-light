import { expect, test } from "@playwright/test";

test("path encounter opens a battle arena with timeline, inspect, and party swap", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/vite-entry.html");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2400);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyW");
  await page.keyboard.press("KeyE");

  await expect(page.getByTestId("battle-panel")).toBeVisible();
  await expect(page.getByTestId("turn-timeline")).toContainText("Kael");
  await expect(page.getByTestId("combatant-kael")).toContainText("40/40 HP");
  await expect(page.getByTestId("combatant-orun")).toContainText("48/48 HP");

  await page.getByRole("button", { name: "Swap Orun" }).click();
  await expect(page.getByTestId("combatant-orun")).toHaveClass(/active/);
  await page.getByRole("button", { name: "Attack" }).click();
  await page.getByRole("button", { name: "Inspect" }).click();
  await expect(page.getByTestId("battle-log")).toContainText("Kael can catch it");
  expect(consoleErrors).toEqual([]);
});
