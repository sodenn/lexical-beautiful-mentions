"use client"; // prettier-ignore
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { $getRoot, EditorState } from "lexical";
import {
  BeautifulMentionsPlugin,
  ZeroWidthPlugin,
} from "lexical-beautiful-mentions";
import { useCallback, useState } from "react";
import { useConfiguration } from "./ConfigurationProvider";
import "./Editor.css";
import MentionsToolbar from "./MentionsToolbar";
import Menu from "./Menu";
import MenuItem from "./MenuItem";
import { Placeholder } from "./Placeholder";
import { getDebugTextContent } from "./debug";
import editorConfig from "./editorConfig";

const mentionItems: Record<string, string[]> = {
  "@": ["Anton", "Boris", "Catherine", "Dmitri", "Elena", "Felix", "Gina"],
  "#": ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"],
  "due:": ["Today", "Tomorrow", "01-01-2023"],
  "rec:": ["week", "month", "year"],
  "\\w+:": [],
};

const queryMentions = async (
  trigger: string,
  queryString: string,
  asynchronous: boolean,
) => {
  const items = mentionItems[trigger];
  if (!items) {
    return [];
  }
  if (asynchronous) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return items.filter((item) =>
    item.toLowerCase().includes(queryString.toLowerCase()),
  );
};

export default function Editor() {
  const [value, setValue] = useState<string>();
  const {
    asynchronous,
    initialValue,
    autoFocus,
    allowSpaces,
    creatable,
    insertOnBlur,
    showTriggers,
    showMentionsOnDelete,
  } = useConfiguration();

  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const content = getDebugTextContent(root);
      setValue(content);
    });
  }, []);

  const handleSearch = useCallback(
    (trigger: string, queryString: string) =>
      queryMentions(trigger, queryString, asynchronous),
    [asynchronous],
  );

  return (
    <div className="mt-5 w-full max-w-2xl">
      <LexicalComposer
        initialConfig={editorConfig(Object.keys(mentionItems), initialValue)}
      >
        <div className="relative rounded bg-black/10 text-left dark:bg-white/20">
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                style={{ tabSize: 1 }}
                className="relative min-h-[150px] resize-none px-3 py-4 caret-gray-900 outline-none outline-0 dark:text-gray-100 dark:caret-gray-100"
              />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          {autoFocus !== "none" && (
            <AutoFocusPlugin defaultSelection={autoFocus} />
          )}
          <ZeroWidthPlugin />
          <BeautifulMentionsPlugin
            onSearch={handleSearch}
            searchDelay={asynchronous ? 250 : 0}
            triggers={Object.keys(mentionItems)}
            menuComponent={Menu}
            menuItemComponent={MenuItem}
            allowSpaces={allowSpaces}
            creatable={creatable}
            insertOnBlur={insertOnBlur}
            showMentionsOnDelete={showMentionsOnDelete}
            showTriggers={
              showTriggers
                ? (e) => (e.ctrlKey && e.code === "Space") || e.code === "Slash"
                : undefined
            }
          />
        </div>
        <MentionsToolbar />
      </LexicalComposer>
      <div className="hidden" data-testid="plaintext">
        {value}
      </div>
    </div>
  );
}
