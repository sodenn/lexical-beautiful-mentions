import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $nodesOfType } from "lexical";
import { useCallback } from "react";
import { INSERT_MENTION_COMMAND, OPEN_MENTIONS_MENU_COMMAND, REMOVE_MENTIONS_COMMAND, RENAME_MENTIONS_COMMAND, } from "./MentionCommands";
import { BeautifulMentionNode } from "./MentionNode";
/**
 * Hook that provides access to the BeautifulMentionsPlugin. It allows you to insert,
 * remove and rename mentions from outside the editor.
 */
export function useBeautifulMentions() {
    const [editor] = useLexicalComposerContext();
    /**
     * Inserts a mention at the current selection.
     */
    const insertMention = useCallback((options) => editor.dispatchCommand(INSERT_MENTION_COMMAND, options), [editor]);
    /**
     * Removes all mentions that match the given trigger and an optional value.
     */
    const removeMentions = useCallback((options) => editor.dispatchCommand(REMOVE_MENTIONS_COMMAND, options), [editor]);
    /**
     * Renames all mentions that match the given trigger and an optional value.
     */
    const renameMentions = useCallback((options) => editor.dispatchCommand(RENAME_MENTIONS_COMMAND, options), [editor]);
    /**
     * Returns true if there are mentions that match the given trigger and an optional value.
     */
    const hasMentions = useCallback(({ value, trigger }) => {
        return editor.getEditorState().read(() => {
            const mentions = $nodesOfType(BeautifulMentionNode);
            if (value) {
                return mentions.some((mention) => mention.getTrigger() === trigger && mention.getValue() === value);
            }
            return mentions.some((mention) => mention.getTrigger() === trigger);
        });
    }, [editor]);
    /**
     * Opens the mentions menu at the current selection.
     */
    const openMentionsMenu = useCallback((options) => editor.dispatchCommand(OPEN_MENTIONS_MENU_COMMAND, options), [editor]);
    /**
     * Returns true if the mentions menu is open.
     */
    const isMentionsMenuOpen = useCallback(() => {
        const element = document.querySelector('[role="list"][aria-label="Choose a mention"][aria-hidden="false"]');
        return !!element;
    }, []);
    /**
     * Returns all mentions used in the editor.
     */
    const getMentions = useCallback(() => {
        return editor.getEditorState().read(() => $nodesOfType(BeautifulMentionNode).map((node) => {
            const { trigger, value } = node.exportJSON();
            return { trigger, value };
        }));
    }, [editor]);
    return {
        getMentions,
        insertMention,
        removeMentions,
        renameMentions,
        hasMentions,
        openMentionsMenu,
        isMentionsMenuOpen,
    };
}
