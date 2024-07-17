import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback } from "react";
import {
  HasMentions,
  INSERT_MENTION_COMMAND,
  InsertMention,
  OPEN_MENTION_MENU_COMMAND,
  OpenMentionMenu,
  REMOVE_MENTIONS_COMMAND,
  RENAME_MENTIONS_COMMAND,
  RemoveMentions,
  RenameMentions,
} from "./mention-commands";
import { $findBeautifulMentionNodes } from "./mention-utils";

/**
 * Hook that provides access to the BeautifulMentionsPlugin. It allows you to insert,
 * remove and rename mentions from outside the editor.
 */
export function useBeautifulMentions() {
  const [editor] = useLexicalComposerContext();

  /**
   * Inserts a mention at the current selection.
   */
  const insertMention = useCallback(
    (options: InsertMention) =>
      editor.dispatchCommand(INSERT_MENTION_COMMAND, options),
    [editor],
  );

  /**
   * Removes all mentions that match the given trigger and an optional value.
   */
  const removeMentions = useCallback(
    (options: RemoveMentions) =>
      editor.dispatchCommand(REMOVE_MENTIONS_COMMAND, options),
    [editor],
  );

  /**
   * Renames all mentions that match the given trigger and an optional value.
   */
  const renameMentions = useCallback(
    (options: RenameMentions) =>
      editor.dispatchCommand(RENAME_MENTIONS_COMMAND, options),
    [editor],
  );

  /**
   * Returns `true` if there are mentions that match the given trigger and an optional value.
   */
  const hasMentions = useCallback(
    ({ value, trigger }: HasMentions) => {
      return editor.getEditorState().read(() => {
        const mentions = $findBeautifulMentionNodes();
        if (value) {
          return mentions.some(
            (mention) =>
              mention.getTrigger() === trigger && mention.getValue() === value,
          );
        }
        return mentions.some((mention) => mention.getTrigger() === trigger);
      });
    },
    [editor],
  );

  /**
   * Opens the mention menu at the current selection.
   */
  const openMentionMenu = useCallback(
    (options: OpenMentionMenu) =>
      editor.dispatchCommand(OPEN_MENTION_MENU_COMMAND, options),
    [editor],
  );

  /**
   * Returns all mentions used in the editor.
   */
  const getMentions = useCallback(() => {
    return editor.getEditorState().read(() =>
      $findBeautifulMentionNodes().map((node) => {
        const { trigger, value, data } = node.exportJSON();
        return { trigger, value, data };
      }),
    );
  }, [editor]);

  return {
    getMentions,
    insertMention,
    removeMentions,
    renameMentions,
    hasMentions,
    openMentionMenu,
  };
}
