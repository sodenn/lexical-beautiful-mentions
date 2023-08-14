import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Combobox", () => {
  test("should open the dropdown menu when the editor is focused", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await expect(utils.combobox).toBeVisible();
  });

  test("should not have any trigger selected by default", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "");
  });

  test("should select the first trigger when pressing down", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editor.press("ArrowDown");
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "@");
  });

  test("should select the last trigger when pressing up", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editor.press("ArrowUp");
    await expect(utils.combobox).toHaveAttribute(
      "aria-activedescendant",
      "rec:",
    );
  });

  test("should select the first trigger when pressing down after selecting the last trigger", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editor.press("ArrowUp"); // select the last trigger
    await utils.editor.press("ArrowDown"); // remove the selection
    await utils.editor.press("ArrowDown");
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "@");
  });

  test("should select the last trigger when pressing up after selecting the first trigger", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editor.press("ArrowDown"); // select the first trigger
    await utils.editor.press("ArrowUp"); // remove the selection
    await utils.editor.press("ArrowUp");
    await expect(utils.combobox).toHaveAttribute(
      "aria-activedescendant",
      "rec:",
    );
  });

  test("should select the first trigger when starting to type a trigger character", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editorType("d");
    await expect(utils.combobox.getByRole("menuitem")).toHaveCount(1);
    await expect(utils.combobox).toHaveAttribute(
      "aria-activedescendant",
      "due:",
    );
    await utils.combobox.getByText("due:").click();
    await utils.hasText("due:");
  });

  test("should select the first mention after selecting a trigger", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editorType("@");
    await expect(utils.combobox).toHaveAttribute(
      "aria-activedescendant",
      "Anton",
    );
  });

  test("should remove the trigger selection when pressing backspace", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editor.press("ArrowDown");
    await utils.editorType("@");
    await expect(utils.combobox).toHaveAttribute(
      "aria-activedescendant",
      "Anton",
    );
    await utils.editor.press("Backspace");
    await expect(utils.combobox).toBeVisible();
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "");
  });

  test("should not remove the selection of a multi-character trigger when pressing backspace", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editorType("due");
    await expect(utils.combobox).toHaveAttribute(
      "aria-activedescendant",
      "due:",
    );
    await utils.editor.press("Backspace");
    await expect(utils.combobox).toBeVisible();
    await expect(utils.combobox).toHaveAttribute(
      "aria-activedescendant",
      "due:",
    );
    await utils.hasText("du");
  });

  test("should render the mentions after selecting a trigger", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editorType("due");
    await utils.editor.press("Tab");
    await expect(utils.combobox).toBeVisible();
    await expect(utils.combobox.getByRole("menuitem")).toHaveCount(3);
  });

  test("should render the triggers after selecting a mention by pressing enter", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editorType("@");
    await utils.editor.press("Enter");
    await expect(utils.combobox).toBeVisible();
    await expect(utils.combobox.getByRole("menuitem")).toHaveCount(4);
    await utils.hasText("[@Anton]");
  });

  test("should render the triggers after selecting a mention by pressing tab", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editorType("@");
    await utils.editor.press("Tab");
    await expect(utils.combobox).toBeVisible();
    await expect(utils.combobox.getByRole("menuitem")).toHaveCount(4);
    await utils.hasText("[@Anton]");
  });

  test("should render the triggers after selecting a mention by clicking on it", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editorType("@");
    await utils.combobox.getByText("Anton").click();
    await expect(utils.combobox).toBeVisible();
    await expect(utils.combobox.getByRole("menuitem")).toHaveCount(4);
    await utils.hasText("[@Anton]");
  });

  test("should remove the selection when the combobox is closed", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editor.press("ArrowDown");
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "@");
    await page
      .getByRole("heading", { name: "lexical-beautiful-mentions" })
      .click();
    await utils.editor.focus();
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "");
  });

  test("should remove the selection after pressing ArrowUp or ArrowDown when the first or last combobox item is selected", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    await utils.editor.press("ArrowDown");
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "@");
    await utils.editor.press("ArrowUp");
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "");
    await utils.editor.press("ArrowUp");
    await expect(utils.combobox).toHaveAttribute(
      "aria-activedescendant",
      "rec:",
    );
    await utils.editor.press("ArrowDown");
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "");
    await utils.editor.press("ArrowDown");
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "@");
  });

  test("should call the onComboboxOpen and onComboboxClose callbacks", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    let open = await utils.isMenuOrComboboxOpen();
    expect(open).toBe(true);
    await page
      .getByRole("heading", { name: "lexical-beautiful-mentions" })
      .click();
    open = await utils.isMenuOrComboboxOpen();
    expect(open).toBe(false);
  });

  test("should call the onComboboxSelect callback", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
      },
    );
    let selected = await utils.isComboboxItemSelected();
    expect(selected).toBe(false);
    await utils.editor.press("ArrowDown");
    selected = await utils.isComboboxItemSelected();
    expect(selected).toBe(true);
  });

  test("should display additional combobox items", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        combobox: true,
        comboboxAdditionalItems: true,
      },
    );
    await expect(
      utils.combobox.getByRole("menuitem", { name: "Choose additionalItem" }),
    ).toBeVisible();
    await utils.combobox
      .getByRole("menuitem", { name: "Choose additionalItem" })
      .click();
    // position the mouse outside the combobox
    await page
      .getByRole("heading", { name: "lexical-beautiful-mentions" })
      .click();
    let open = await utils.isMenuOrComboboxOpen();
    expect(open).toBe(false);
    await utils.editor.blur();
    await utils.sleep(200);
    await utils.editor.focus();
    open = await utils.isMenuOrComboboxOpen();
    expect(open).toBe(true);
    await expect(utils.combobox).toHaveAttribute("aria-activedescendant", "");
  });
});
