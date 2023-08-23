import CustomMentionComponent from "@/components/CustomMentionComponent";
import theme from "@/lib/editor-theme";
import { InitialConfigType } from "@lexical/react/LexicalComposer";
import { $createParagraphNode, $getRoot } from "lexical";
import {
  $convertToMentionNodes,
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
): InitialConfigType => ({
  namespace: "",
  theme,
  onError(error: any) {
    throw error;
  },
  editorState: setEditorState(initialValue, triggers),
  nodes: [...createBeautifulMentionNode(CustomMentionComponent), ZeroWidthNode],
});

export default editorConfig;
