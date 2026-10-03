import { expect, test } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

test("direct-file build opens Tidewake from file protocol", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(pathToFileURL(resolve("file-dist/index.html")).href);
  await expect(page.getByRole("heading", { name: "Tidewake" })).toBeVisible();
  await expect(page.getByTestId("camera-volume")).toContainText("Village Square");

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();

  const canvasPixels = await canvas.evaluate((node) => {
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

  expect(canvasPixels).toBeGreaterThan(0);
  expect(consoleErrors).toEqual([]);
});

test("root index opens Tidewake from file protocol", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(pathToFileURL(resolve("index.html")).href);
  await expect(page.getByRole("heading", { name: "Tidewake" })).toBeVisible();
  await expect(page.getByTestId("camera-volume")).toContainText("Village Square");
  await expect(page.locator("canvas")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("dev html also opens Tidewake from file protocol", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(pathToFileURL(resolve("dev.html")).href);
  await expect(page.getByRole("heading", { name: "Tidewake" })).toBeVisible();
  await expect(page.getByTestId("camera-volume")).toContainText("Village Square");
  await expect(page.locator("canvas")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
