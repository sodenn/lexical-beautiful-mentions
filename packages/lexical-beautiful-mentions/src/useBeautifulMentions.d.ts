import { HasMentions, InsertMention, OpenMentionsMenu, RemoveMentions, RenameMentions } from "./MentionCommands";
/**
 * Hook that provides access to the BeautifulMentionsPlugin. It allows you to insert,
 * remove and rename mentions from outside the editor.
 */
export declare function useBeautifulMentions(): {
    getMentions: () => {
        trigger: string;
        value: string;
    }[];
    insertMention: (options: InsertMention) => boolean;
    removeMentions: (options: RemoveMentions) => boolean;
    renameMentions: (options: RenameMentions) => boolean;
    hasMentions: ({ value, trigger }: HasMentions) => boolean;
    openMentionsMenu: (options: OpenMentionsMenu) => boolean;
    isMentionsMenuOpen: () => boolean;
};
//# sourceMappingURL=useBeautifulMentions.d.ts.map