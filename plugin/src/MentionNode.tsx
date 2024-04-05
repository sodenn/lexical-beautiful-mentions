import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMExportOutput,
  DecoratorNode,
  LexicalEditor,
  SerializedLexicalNode,
  Spread,
  type DOMConversionOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
} from "lexical";
import React, { ElementType } from "react";
import {
  BeautifulMentionComponentProps,
  BeautifulMentionsItemData,
} from "./BeautifulMentionsPluginProps";
import MentionComponent from "./MentionComponent";
import { BeautifulMentionsTheme } from "./theme";

export type SerializedBeautifulMentionNode = Spread<
  {
    trigger: string;
    value: string;
    data?: { [p: string]: BeautifulMentionsItemData };
  },
  SerializedLexicalNode
>;

function convertElement(domNode: HTMLElement): DOMConversionOutput | null {
  const trigger = domNode.getAttribute(
    "data-lexical-beautiful-mention-trigger",
  );
  const value = domNode.getAttribute("data-lexical-beautiful-mention-value");
  let data: { [p: string]: BeautifulMentionsItemData } | undefined = undefined;
  const dataStr = domNode.getAttribute("data-lexical-beautiful-mention-data");
  if (dataStr) {
    try {
      data = JSON.parse(dataStr);
    } catch (e) {
      console.warn(
        "Failed to parse data attribute of beautiful mention node",
        e,
      );
    }
  }
  if (trigger != null && value !== null) {
    const node = $createBeautifulMentionNode(trigger, value, data);
    return { node };
  }
  return null;
}

/**
 * This node is used to represent a mention used in the BeautifulMentionPlugin.
 */
export class BeautifulMentionNode extends DecoratorNode<React.JSX.Element> {
  __trigger: string;
  __value: string;
  __data?: { [p: string]: BeautifulMentionsItemData };

  static getType(): string {
    return "beautifulMention";
  }

  static clone(node: BeautifulMentionNode): BeautifulMentionNode {
    return new BeautifulMentionNode(
      node.__trigger,
      node.__value,
      node.__data,
      node.__key,
    );
  }

  constructor(
    trigger: string,
    value: string,
    data?: { [p: string]: BeautifulMentionsItemData },
    key?: NodeKey,
  ) {
    super(key);
    this.__trigger = trigger;
    this.__value = value;
    this.__data = data;
  }

  createDOM(): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-beautiful-mention", "true");
    element.setAttribute(
      "data-lexical-beautiful-mention-trigger",
      this.__trigger,
    );
    element.setAttribute("data-lexical-beautiful-mention-value", this.__value);
    if (this.__data) {
      element.setAttribute(
        "data-lexical-beautiful-mention-data",
        JSON.stringify(this.__data),
      );
    }
    element.textContent = this.getTextContent();
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-beautiful-mention")) {
          return null;
        }
        return {
          conversion: convertElement,
          priority: 1,
        };
      },
    };
  }

  static importJSON(
    serializedNode: SerializedBeautifulMentionNode,
  ): BeautifulMentionNode {
    return $createBeautifulMentionNode(
      serializedNode.trigger,
      serializedNode.value,
      serializedNode.data,
    );
  }

  exportJSON(): SerializedBeautifulMentionNode {
    const data = this.__data;
    return {
      trigger: this.__trigger,
      value: this.__value,
      ...(data ? { data } : {}),
      type: "beautifulMention",
      version: 1,
    };
  }

  getTextContent(): string {
    const self = this.getLatest();
    return self.__trigger + self.__value;
  }

  getTrigger(): string {
    const self = this.getLatest();
    return self.__trigger;
  }

  getValue(): string {
    const self = this.getLatest();
    return self.__value;
  }

  setValue(value: string) {
    const self = this.getWritable();
    self.__value = value;
  }

  getData(): { [p: string]: BeautifulMentionsItemData } | undefined {
    const self = this.getLatest();
    return self.__data;
  }

  setData(data?: { [p: string]: BeautifulMentionsItemData }) {
    const self = this.getWritable();
    self.__data = data;
  }

  component(): ElementType<BeautifulMentionComponentProps> | null {
    return null;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): React.JSX.Element {
    const { className, classNameFocused, classNames } =
      this.getCssClassesFromTheme(config);
    return (
      <MentionComponent
        nodeKey={this.getKey()}
        trigger={this.getTrigger()}
        value={this.getValue()}
        data={this.getData()}
        className={className}
        classNameFocused={classNameFocused}
        classNames={classNames}
        component={this.component()}
      />
    );
  }

  getCssClassesFromTheme(config: EditorConfig) {
    const theme: BeautifulMentionsTheme = config.theme.beautifulMentions || {};
    const themeEntry = Object.entries(theme).find(([trigger]) =>
      new RegExp(trigger).test(this.__trigger),
    );
    const key = themeEntry && themeEntry[0];
    const value = themeEntry && themeEntry[1];
    const className = typeof value === "string" ? value : undefined;
    const classNameFocused =
      className && typeof theme[key + "Focused"] === "string"
        ? (theme[key + "Focused"] as string)
        : undefined;
    const classNames =
      themeEntry && typeof value !== "string" ? value : undefined;
    return {
      className,
      classNameFocused,
      classNames,
    };
  }
}

export function $createBeautifulMentionNode(
  trigger: string,
  value: string,
  data?: { [p: string]: BeautifulMentionsItemData },
): BeautifulMentionNode {
  const mentionNode = new BeautifulMentionNode(trigger, value, data);
  return $applyNodeReplacement(mentionNode);
}

export function $isBeautifulMentionNode(
  node: LexicalNode | null | undefined,
): node is BeautifulMentionNode {
  return node instanceof BeautifulMentionNode;
}
