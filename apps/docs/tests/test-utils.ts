import { expect, Page } from "@playwright/test";

type Autofocus = "none" | "start" | "end";

interface TestUtilsOptions {
  initialValue?: string;
  autofocus?: Autofocus;
  asynchronous?: boolean;
  allowSpaces?: boolean;
  creatable?: boolean;
  insertOnBlur?: boolean;
}

export async function testUtils(page: Page, options: TestUtilsOptions = {}) {
  const {
    initialValue = "",
    autofocus = "end",
    asynchronous = false,
    allowSpaces = false,
    creatable = false,
    insertOnBlur = false,
  } = options;
  const utils = new TestUtils(
    page,
    initialValue,
    autofocus,
    asynchronous,
    allowSpaces,
    creatable,
    insertOnBlur
  );
  await utils.init();
  return utils;
}

export class TestUtils {
  public initialValue: string;

  constructor(
    private page: Page,
    initialValue: string,
    private autofocus: Autofocus,
    private asynchronous: boolean,
    private allowSpaces: boolean,
    private creatable: boolean,
    private insertOnBlur: boolean
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
    await expect(plaintext).toBe(text);
  }

  async getPlaintext() {
    await this.sleep(200);
    return await this.page.getByTestId("plaintext").innerText();
  }

  async countMentions(count: number) {
    const plaintext = await this.getPlaintext();
    const regex = /\[[^[\]]+]/g;
    const matchCount = plaintext.match(regex).length;
    await expect(matchCount).toBe(count);
  }

  get editor() {
    return this.page.getByRole("textbox");
  }

  get menu() {
    return this.page.getByRole("list", { name: "Choose a mention" });
  }

  sleep(ms: number) {
    return this.page.waitForTimeout(ms);
  }

  private setInitialValue(initialValue: string) {
    this.initialValue = encodeURIComponent(initialValue);
  }

  private async goto() {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const host = process.env.HOST || "localhost";
    let url = `http://${host}:3000?focus=${this.autofocus}`;
    if (this.asynchronous) {
      url += `&async=${this.asynchronous}`;
    }
    if (this.allowSpaces) {
      url += `&spaces=${this.allowSpaces}`;
    }
    if (this.creatable) {
      url += `&new=${this.creatable}`;
    }
    if (this.insertOnBlur) {
      url += `&blur=${this.insertOnBlur}`;
    }
    if (this.initialValue === "") {
      url += `&value`;
    } else {
      url += `&value=${this.initialValue}`;
    }
    await this.page.goto(url);
    await this.page.waitForTimeout(100);
  }

  private async pressKey(key: string, n = 1) {
    for (let i = 0; i < n; i++) {
      await this.page.getByRole("textbox").press(key, { delay: 10 });
    }
  }
}
