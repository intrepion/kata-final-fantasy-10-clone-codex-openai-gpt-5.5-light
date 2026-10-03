import { expect, test } from "@playwright/test";

test("MVP 1A renders Tidewake and lets Kael move through camera volumes", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tidewake" })).toBeVisible();
  await expect(page.getByTestId("camera-volume")).toContainText("Village Square");
  await page.keyboard.press("KeyM");
  await expect(page.getByTestId("board-panel")).toBeVisible();
  await page.keyboard.press("KeyM");
  await expect(page.getByTestId("board-panel")).toBeHidden();

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  await page.keyboard.down("KeyD");
  await page.waitForTimeout(2600);
  await page.keyboard.up("KeyD");
  await expect(page.getByTestId("camera-volume")).toContainText(/Beach Bend|Shellfiend Overlook/);

  const pixels = await canvas.evaluate((node) => {
    const canvasNode = node as HTMLCanvasElement;
    const context = canvasNode.getContext("webgl2") ?? canvasNode.getContext("webgl");
    if (!context) return 0;

    const sample = new Uint8Array(4);
    context.readPixels(
      Math.floor(canvasNode.width / 2),
      Math.floor(canvasNode.height / 2),
      1,
      1,
      context.RGBA,
      context.UNSIGNED_BYTE,
      sample
    );
    return sample[0] + sample[1] + sample[2] + sample[3];
  });

  expect(pixels).toBeGreaterThan(0);
  expect(consoleErrors).toEqual([]);
});
