import { LexicalEditor, LexicalNodeReplacement } from "lexical";
import { EditorConfig } from "lexical/LexicalEditor";
import React, { ElementType } from "react";
import { BeautifulMentionComponentProps } from "./BeautifulMentionsPluginProps";
import {
  BeautifulMentionNode,
  SerializedBeautifulMentionNode,
} from "./MentionNode";

export type CustomBeautifulMentionNodeClass = ReturnType<typeof generateClass>;

export let CustomBeautifulMentionNode: CustomBeautifulMentionNodeClass;

export function setCustomBeautifulMentionNode(
  BeautifulMentionNodeClass: CustomBeautifulMentionNodeClass,
) {
  CustomBeautifulMentionNode = BeautifulMentionNodeClass;
}

/**
 * Instead of using the default `BeautifulMentionNode` class, you can
 * extend it and use the mention component of your choice.
 */
export function createBeautifulMentionNode(
  mentionComponent: ElementType<BeautifulMentionComponentProps>,
): [CustomBeautifulMentionNodeClass, LexicalNodeReplacement] {
  CustomBeautifulMentionNode =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    CustomBeautifulMentionNode || generateClass(mentionComponent);
  return [
    CustomBeautifulMentionNode,
    {
      replace: BeautifulMentionNode,
      with: (node: BeautifulMentionNode) => {
        return new CustomBeautifulMentionNode(
          node.getTrigger(),
          node.getValue(),
          node.getData(),
        );
      },
    },
  ];
}

function generateClass(
  mentionComponent: ElementType<BeautifulMentionComponentProps>,
) {
  return class CustomBeautifulMentionNode extends BeautifulMentionNode {
    static getType() {
      return "custom-beautifulMention";
    }
    static clone(node: CustomBeautifulMentionNode) {
      return new CustomBeautifulMentionNode(
        node.__trigger,
        node.__value,
        node.__data,
        node.__key,
      );
    }
    static importJSON(serializedNode: SerializedBeautifulMentionNode) {
      return new CustomBeautifulMentionNode(
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
        type: "custom-beautifulMention",
        version: 1,
      };
    }
    component(): ElementType<BeautifulMentionComponentProps> | null {
      return mentionComponent;
    }
    decorate(editor: LexicalEditor, config: EditorConfig): React.JSX.Element {
      return super.decorate(editor, config);
    }
  };
}
