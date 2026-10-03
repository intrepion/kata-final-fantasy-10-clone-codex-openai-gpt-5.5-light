import { expect, test } from "@playwright/test";

test("winning a path encounter awards an Echo Shard, unlocks a board node, and saves it", async ({
  page
}) => {
  await page.goto("/vite-entry.html");
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2400);
  await page.keyboard.up("KeyD");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyW");
  await page.keyboard.press("KeyE");

  await expect(page.getByTestId("battle-panel")).toBeVisible();

  for (let count = 0; count < 5; count += 1) {
    await page.getByRole("button", { name: "Attack" }).click();
    if (await page.getByTestId("board-panel").isVisible()) {
      break;
    }
  }

  await expect(page.getByTestId("echo-shards")).toContainText("Echo Shards: 1");
  await expect(page.getByTestId("board-panel")).toBeVisible();

  await page.getByRole("button", { name: "Spend 1" }).first().click();
  await expect(page.getByTestId("echo-shards")).toContainText("Echo Shards: 0");
  await expect(page.getByTestId("board-status")).toContainText("quick-step");

  await page.keyboard.down("KeyA");
  await page.waitForTimeout(2800);
  await page.keyboard.up("KeyA");
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(600);
  await page.keyboard.up("KeyS");
  await page.keyboard.press("KeyE");
  await page.reload();

  await expect(page.getByTestId("echo-shards")).toContainText("Echo Shards: 0");
  await expect(page.getByTestId("board-status")).toContainText("quick-step");
});
