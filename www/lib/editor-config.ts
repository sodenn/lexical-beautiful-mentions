import CustomMentionComponent from "@/components/CustomMentionComponent";
import theme from "@/lib/editor-theme";
import { InitialConfigType } from "@lexical/react/LexicalComposer";
import { $createParagraphNode, $getRoot } from "lexical";
import {
  $convertToMentionNodes,
  BeautifulMentionNode,
  ZeroWidthNode,
  createBeautifulMentionNode,
} from "lexical-beautiful-mentions";

export const defaultInitialValue =
  "Hey @John, the task is #urgent and due:tomorrow";

function setEditorState(initialValue: string, triggers: string[]) {
  return () => {
    const root = $getRoot();
    if (root.getFirstChild() === null) {
      const paragraph = $createParagraphNode();
      paragraph.append(...$convertToMentionNodes(initialValue, triggers));
      root.append(paragraph);
    }
  };
}

const editorConfig = (
  triggers: string[],
  initialValue: string,
  customMentionNode: boolean,
): InitialConfigType => ({
  namespace: "",
  theme,
  onError(error: any) {
    throw error;
  },
  editorState: setEditorState(initialValue, triggers),
  nodes: [
    ...(customMentionNode
      ? createBeautifulMentionNode(CustomMentionComponent)
      : [BeautifulMentionNode]),
    ZeroWidthNode,
  ],
});

export default editorConfig;
