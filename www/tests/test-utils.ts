import { expect, Page } from "@playwright/test";
import { Locator } from "playwright";

type Autofocus = "none" | "start" | "end";

interface TestUtilsOptions {
  initialValue?: string;
  autofocus?: Autofocus;
  asynchronous?: boolean;
  allowSpaces?: boolean;
  autoSpace?: boolean;
  creatable?: boolean;
  insertOnBlur?: boolean;
  commandFocus?: boolean;
  combobox?: boolean;
  mentionEnclosure?: boolean;
  showMentionsOnDelete?: boolean;
  comboboxAdditionalItems?: boolean;
  customMentionNode?: boolean;
  emptyComponent?: boolean;
}

type PlaywrightArgs = { page: Page; browserName: string };

export async function testUtils(
  args: PlaywrightArgs,
  options: TestUtilsOptions = {},
) {
  const {
    initialValue = "",
    autofocus = "end",
    asynchronous = false,
    allowSpaces = false,
    autoSpace = true,
    creatable = false,
    insertOnBlur = false,
    commandFocus = true,
    combobox = false,
    mentionEnclosure = false,
    showMentionsOnDelete = false,
    comboboxAdditionalItems = false,
    customMentionNode = false,
    emptyComponent = false,
  } = options;
  const utils = new TestUtils(
    args.page,
    args.browserName,
    initialValue,
    autofocus,
    asynchronous,
    allowSpaces,
    autoSpace,
    creatable,
    insertOnBlur,
    commandFocus,
    combobox,
    mentionEnclosure,
    showMentionsOnDelete,
    comboboxAdditionalItems,
    customMentionNode,
    emptyComponent,
  );
  await utils.init();
  return utils;
}

export class TestUtils {
  public initialValue: string;

  constructor(
    private page: PlaywrightArgs["page"],
    private browserName: PlaywrightArgs["browserName"],
    initialValue: string,
    private autofocus: Autofocus,
    private asynchronous: boolean,
    private allowSpaces: boolean,
    private autoSpace: boolean,
    private creatable: boolean,
    private insertOnBlur: boolean,
    private commandFocus: boolean,
    private _combobox: boolean,
    private mentionEnclosure: boolean,
    private showMentionsOnDelete: boolean,
    private comboboxAdditionalItems: boolean,
    private customMentionNode: boolean,
    private emptyComponent: boolean,
  ) {
    this.setInitialValue(initialValue);
  }

  async init() {
    await this.goto();
  }

  async focusEnd() {
    await this.editor.focus();
    await this.moveCaretToEnd();
  }

  async moveCursorForward(n = 1) {
    await this.moveCaretToStart();
    await this.pressKey("ArrowRight", n);
  }

  async moveCursorBackward(n = 1) {
    await this.moveCaretToEnd();
    await this.pressKey("ArrowLeft", n);
  }

  async deleteText(n = 1) {
    await this.pressKey("Backspace", n);
  }

  async moveCaretToStart() {
    await this.page.getByRole("textbox").press("ArrowUp", { delay: 10 });
  }

  async moveCaretToEnd() {
    await this.page.getByRole("textbox").press("ArrowDown", { delay: 10 });
  }

  async hasText(text: string) {
    const plaintext = await this.getPlaintext();
    expect(plaintext).toBe(text);
  }

  async getPlaintext() {
    await this.sleep(200);
    return await this.page.getByTestId("plaintext").innerText();
  }

  async countMentions(count: number) {
    const plaintext = await this.getPlaintext();
    const regex = /\[[^[\]]+]/g;
    const match = plaintext.match(regex);
    if (match) {
      expect(match.length).toBe(count);
    } else {
      expect(match).toBeNull();
    }
  }

  get editor() {
    return this.page.getByRole("textbox");
  }

  async editorType(text: string, delay = 50) {
    await this.editor.pressSequentially(text, { delay });
    await this.sleep(200);
  }

  get mentionsMenu() {
    return this.page.getByRole("menu", { name: "Choose a mention" });
  }

  get combobox() {
    return this.page.getByRole("menu", { name: "Choose trigger and value" });
  }

  async isMenuOrComboboxOpen() {
    await this.sleep(200);
    const text = await this.page.getByTestId("menu-combobox-open").innerText();
    return text === "true";
  }

  async isComboboxItemSelected() {
    await this.sleep(200);
    const text = await this.page
      .getByTestId("combobox-item-selected")
      .innerText();
    return text === "true";
  }

  sleep(ms: number) {
    // eslint-disable-next-line playwright/no-wait-for-timeout
    return this.page.waitForTimeout(ms);
  }

  async expectNotVisibleFor(
    locator: Locator,
    duration: number,
    interval: number = 100,
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < duration) {
      const isVisible = await locator.isVisible();
      if (isVisible) {
        throw new Error("Element became visible during the period");
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  private setInitialValue(initialValue: string) {
    this.initialValue = encodeURIComponent(initialValue);
  }

  private async goto() {
    const host = process.env.HOST || "localhost";
    let url = `http://${host}:3000?focus=${this.autofocus}`;
    url += `&async=${this.asynchronous}`;
    url += `&combobox=${this._combobox}`;
    url += `&enclosure=${this.mentionEnclosure}`;
    url += `&mentions=${this.showMentionsOnDelete}`;
    url += `&aspace=${this.allowSpaces}`;
    url += `&ospace=${this.autoSpace}`;
    url += `&new=${this.creatable}`;
    url += `&blur=${this.insertOnBlur}`;
    url += `&cf=${this.commandFocus}`;
    url += `&value=${this.initialValue}`;
    url += `&cbai=${this.comboboxAdditionalItems}`;
    url += `&cstmn=${this.customMentionNode}`;
    url += `&empty=${this.emptyComponent}`;
    await this.page.goto(url);
    await this.sleep(100);
  }

  private async pressKey(key: string, n = 1) {
    for (let i = 0; i < n; i++) {
      await this.page.getByRole("textbox").press(key, { delay: 10 });
    }
  }
}
