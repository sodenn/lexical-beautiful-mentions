import { test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("mentions handling", () => {
  test("should render a new mention with dashes", async ({ page }) => {
    const utils = await testUtils(page, {
      initialValue: "due:2023-06-06",
    });
    await utils.sleep(200);
    await utils.hasText("[due:2023-06-06]");
  });

  test("should insert a new mention with spaces", async ({ page }) => {
    const utils = await testUtils(page, {
      allowSpaces: true,
      creatable: true,
      mentionEnclosure: true,
    });
    await utils.editor.type("@John Doe");
    await utils.sleep(200);
    await utils.editor.press("Tab");
    await utils.hasText(`[@"John Doe"]`);
  });

  test("should remove a mention via undo command (Ctrl/Cmd + Z)", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils(page);
    const undoCommand = process.platform === "darwin" ? "Meta+Z" : "Control+Z";
    await utils.editor.type("@Catherine");
    await utils.editor.press("Enter");
    await utils.hasText("[@Catherine]");
    await utils.editor.press(undoCommand);
    await utils.hasText("@Catherine");
    await utils.editor.press(undoCommand);
    await utils.hasText("@C");
    await utils.editor.press(undoCommand);
    await utils.hasText("@");
    await utils.editor.press(undoCommand);
    await utils.hasText("");
  });
});
