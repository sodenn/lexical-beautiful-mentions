import { jsx as _jsx } from "react/jsx-runtime";
import { $applyNodeReplacement, DecoratorNode, } from "lexical";
import MentionComponent from "./MentionComponent";
function convertElement(domNode) {
    const value = domNode.getAttribute("data-lexical-beautiful-mention-value");
    const trigger = domNode.getAttribute("data-lexical-beautiful-mention-trigger");
    if (value !== null && trigger != null) {
        const node = $createBeautifulMentionNode(trigger, value);
        return { node };
    }
    return null;
}
/**
 * This node is used to represent a mention used in the BeautifulMentionPlugin.
 */
export class BeautifulMentionNode extends DecoratorNode {
    static getType() {
        return "beautifulMention";
    }
    static clone(node) {
        return new BeautifulMentionNode(node.__trigger, node.__value, node.__key);
    }
    static importJSON(serializedNode) {
        return $createBeautifulMentionNode(serializedNode.trigger, serializedNode.value);
    }
    exportDOM() {
        const element = document.createElement("span");
        element.setAttribute("data-lexical-beautiful-mention", "true");
        element.setAttribute("data-lexical-beautiful-mention-trigger", this.__trigger);
        element.setAttribute("data-lexical-beautiful-mention-value", this.__value);
        element.textContent = this.getTextContent();
        return { element };
    }
    static importDOM() {
        return {
            span: (domNode) => {
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
    constructor(trigger, value, key) {
        super(key);
        this.__trigger = trigger;
        this.__value = value;
    }
    exportJSON() {
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
    getTrigger() {
        const self = this.getLatest();
        return self.__trigger;
    }
    getValue() {
        const self = this.getLatest();
        return self.__value;
    }
    setValue(value) {
        const self = this.getWritable();
        self.__value = value;
    }
    decorate(_editor, config) {
        const theme = config.theme.beautifulMentions || {};
        const entry = Object.entries(theme).find(([trigger]) => new RegExp(trigger).test(this.__trigger));
        const className = entry && entry[1];
        const classNameFocused = entry && theme[entry[0] + "Focused"];
        return (_jsx(MentionComponent, { nodeKey: this.getKey(), mention: this.getTextContent(), className: className, classNameFocused: classNameFocused }));
    }
}
export function $createBeautifulMentionNode(trigger, value) {
    const mentionNode = new BeautifulMentionNode(trigger, value);
    return $applyNodeReplacement(mentionNode);
}
export function $isBeautifulMentionNode(node) {
    return node instanceof BeautifulMentionNode;
}
