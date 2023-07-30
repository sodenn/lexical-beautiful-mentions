import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Combobox", () => {
  test("should open the dropdown menu when the editor is focused", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await expect(utils.triggersMenu).toBeVisible();
    await expect(utils.mentionsMenu).not.toBeVisible();
  });

  test("should not have any trigger selected by default", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "",
    );
  });

  test("should select the first trigger when pressing down", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.press("ArrowDown");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-@",
    );
  });

  test("should select the last trigger when pressing up", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.press("ArrowUp");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-\\w+:",
    );
  });

  test("should select the first trigger when pressing down after selecting the last trigger", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.press("ArrowUp"); // select the last trigger
    await utils.editor.press("ArrowDown"); // remove the selection
    await utils.editor.press("ArrowDown");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-@",
    );
  });

  test("should select the last trigger when pressing up after selecting the first trigger", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.press("ArrowDown"); // select the first trigger
    await utils.editor.press("ArrowUp"); // remove the selection
    await utils.editor.press("ArrowUp");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-\\w+:",
    );
  });

  test("should select the first trigger when starting to type a trigger character", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.type("d");
    await expect(utils.triggersMenu.getByRole("menuitem")).toHaveCount(1);
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-due:",
    );
    await utils.triggersMenu.getByText("due:").click();
    await utils.hasText("due:");
  });

  test("should select the first mention after selecting a trigger", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.type("@");
    await expect(utils.triggersMenu).not.toBeVisible();
    await expect(utils.mentionsMenu).toBeVisible();
    await expect(utils.mentionsMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-Anton",
    );
  });

  test("should remove the trigger selection when pressing backspace", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.press("ArrowDown");
    await utils.editor.type("@");
    await expect(utils.mentionsMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-Anton",
    );
    await utils.editor.press("Backspace");
    await expect(utils.triggersMenu).toBeVisible();
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "",
    );
  });

  test("should not remove the selection of a multi-character trigger when pressing backspace", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.type("due");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-due:",
    );
    await utils.editor.press("Backspace");
    await expect(utils.triggersMenu).toBeVisible();
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-due:",
    );
    await utils.hasText("du");
  });

  test("should render the mentions after selecting a trigger", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.type("due");
    await utils.editor.press("Tab");
    await expect(utils.mentionsMenu).toBeVisible();
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(3);
  });

  test("should render the triggers after selecting a mention by pressing enter", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.type("@");
    await utils.sleep(200);
    await utils.editor.press("Enter");
    await expect(utils.mentionsMenu).not.toBeVisible();
    await expect(utils.triggersMenu).toBeVisible();
    await expect(utils.triggersMenu.getByRole("menuitem")).toHaveCount(5);
    await utils.hasText("[@Anton]");
  });

  test("should render the triggers after selecting a mention by pressing tab", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.type("@");
    await utils.sleep(200);
    await utils.editor.press("Tab");
    await expect(utils.mentionsMenu).not.toBeVisible();
    await expect(utils.triggersMenu).toBeVisible();
    await expect(utils.triggersMenu.getByRole("menuitem")).toHaveCount(5);
    await utils.hasText("[@Anton]");
  });

  test("should render the triggers after selecting a mention by clicking on it", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.type("@");
    await utils.sleep(200);
    await utils.mentionsMenu.getByText("Anton").click();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await expect(utils.triggersMenu).toBeVisible();
    await expect(utils.triggersMenu.getByRole("menuitem")).toHaveCount(5);
    await utils.hasText("[@Anton]");
  });

  test("should remove the selection when the editor is blurred", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.press("ArrowDown");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-@",
    );
    await utils.editor.blur();
    await utils.editor.focus();
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "",
    );
  });

  test("remove the selection after pressing ArrowUp or ArrowDown when the first or last combobox item is selected", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      combobox: true,
    });
    await utils.editor.press("ArrowDown");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-@",
    );
    await utils.editor.press("ArrowUp");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "",
    );
    await utils.editor.press("ArrowUp");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-\\w+:",
    );
    await utils.editor.press("ArrowDown");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "",
    );
    await utils.editor.press("ArrowDown");
    await expect(utils.triggersMenu).toHaveAttribute(
      "aria-activedescendant",
      "beautiful-mention-combobox-@",
    );
  });
});
