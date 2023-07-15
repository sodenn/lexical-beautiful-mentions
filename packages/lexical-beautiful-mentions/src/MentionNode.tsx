import type { SerializedLexicalNode, Spread } from "lexical";
import {
  $applyNodeReplacement,
  DecoratorNode,
  LexicalEditor,
  type DOMConversionOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
} from "lexical";
import React from "react";
import MentionComponent from "./MentionComponent";
import { BeautifulMentionsTheme } from "./theme";

export type SerializedBeautifulMentionNode = Spread<
  {
    value: string;
    trigger: string;
  },
  SerializedLexicalNode
>;

function convertElement(domNode: HTMLElement): DOMConversionOutput | null {
  const value = domNode.getAttribute("data-lexical-beautiful-mention-value");
  const trigger = domNode.getAttribute(
    "data-lexical-beautiful-mention-trigger",
  );
  if (value !== null && trigger != null) {
    const node = $createBeautifulMentionNode(trigger, value);
    return { node };
  }
  return null;
}

/**
 * This node is used to represent a mention used in the BeautifulMentionPlugin.
 */
export class BeautifulMentionNode extends DecoratorNode<React.JSX.Element> {
  __value: string;
  __trigger: string;

  static getType() {
    return "beautifulMention";
  }

  static clone(node: BeautifulMentionNode) {
    return new BeautifulMentionNode(node.__trigger, node.__value, node.__key);
  }

  static importJSON(serializedNode: SerializedBeautifulMentionNode) {
    return $createBeautifulMentionNode(
      serializedNode.trigger,
      serializedNode.value,
    );
  }

  exportDOM() {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-beautiful-mention", "true");
    element.setAttribute(
      "data-lexical-beautiful-mention-trigger",
      this.__trigger,
    );
    element.setAttribute("data-lexical-beautiful-mention-value", this.__value);
    element.textContent = this.getTextContent();
    return { element };
  }

  static importDOM() {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-beautiful-mention")) {
          return null;
        }
        return {
          conversion: convertElement,
          priority: 0,
        };
      },
    };
  }

  constructor(trigger: string, value: string, key?: NodeKey) {
    super(key);
    this.__trigger = trigger;
    this.__value = value;
  }

  exportJSON(): SerializedBeautifulMentionNode {
    return {
      trigger: this.__trigger,
      value: this.__value,
      type: "beautifulMention",
      version: 1,
    };
  }

  createDOM() {
    return document.createElement("span");
  }

  getTextContent() {
    return this.__trigger + this.__value;
  }

  updateDOM() {
    return false;
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

  decorate(_editor: LexicalEditor, config: EditorConfig) {
    const theme: BeautifulMentionsTheme = config.theme.beautifulMentions || {};
    const entry = Object.entries(theme).find(([trigger]) =>
      new RegExp(trigger).test(this.__trigger),
    );
    const key = entry && entry[0];
    const value = entry && entry[1];
    const className = typeof value === "string" ? value : undefined;
    const classNameFocused =
      className && typeof theme[key + "Focused"] === "string"
        ? (theme[key + "Focused"] as string)
        : undefined;
    const themeValues = entry && typeof value !== "string" ? value : undefined;
    return (
      <MentionComponent
        nodeKey={this.getKey()}
        trigger={this.getTrigger()}
        value={this.getValue()}
        className={className}
        classNameFocused={classNameFocused}
        themeValues={themeValues}
      />
    );
  }
}

export function $createBeautifulMentionNode(
  trigger: string,
  value: string,
): BeautifulMentionNode {
  const mentionNode = new BeautifulMentionNode(trigger, value);
  return $applyNodeReplacement(mentionNode);
}

export function $isBeautifulMentionNode(
  node: LexicalNode | null | undefined,
): node is BeautifulMentionNode {
  return node instanceof BeautifulMentionNode;
}
