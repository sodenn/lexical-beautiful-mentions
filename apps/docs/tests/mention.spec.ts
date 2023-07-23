import { test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("mentions handling", () => {
  test("should render a new mention with dashes", async ({ page }) => {
    const utils = await testUtils(page, {
      initialValue: "due:2023-06-06",
    });
    await utils.sleep(100);
    await utils.hasText("[due:2023-06-06]");
  });

  test("should insert a new mention with spaces", async ({ page }) => {
    const utils = await testUtils(page, {
      allowSpaces: true,
      creatable: true,
      mentionEnclosure: true,
    });
    await utils.editor.type("@John Doe");
    await utils.editor.press("Tab");
    await utils.hasText(`[@"John Doe"]`);
  });
});
