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
  BeautifulMentionsItem,
  BeautifulMentionsPlugin,
  ZeroWidthPlugin,
} from "lexical-beautiful-mentions";
import { useCallback, useRef, useState } from "react";
import Combobox from "./Combobox";
import ComboboxItem from "./ComboboxItem";
import { useConfiguration } from "./ConfigurationProvider";
import "./Editor.css";
import MentionsToolbarPlugin from "./MentionsToolbarPlugin";
import Menu from "./Menu";
import MenuItem from "./MenuItem";
import { Placeholder } from "./Placeholder";
import { cn } from "./cn";
import { getDebugTextContent } from "./debug";
import editorConfig from "./editorConfig";
import { useIsFocused } from "./useIsFocused";

const mentionItems: Record<string, BeautifulMentionsItem[]> = {
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
  return items.filter((item) => {
    const value = typeof item === "string" ? item : item.value;
    return value.toLowerCase().includes(queryString.toLowerCase());
  });
};

export default function Editor() {
  const { initialValue } = useConfiguration();
  return (
    <div className="mt-5 w-full max-w-2xl">
      <LexicalComposer
        initialConfig={editorConfig(Object.keys(mentionItems), initialValue)}
      >
        <Plugins />
      </LexicalComposer>
    </div>
  );
}

function Plugins() {
  const [value, setValue] = useState<string>();
  const {
    asynchronous,
    autoFocus,
    allowSpaces,
    creatable,
    insertOnBlur,
    combobox,
    mentionEnclosure,
    showMentionsOnDelete,
  } = useConfiguration();
  const focused = useIsFocused();
  const comboboxAnchor = useRef<HTMLDivElement>(null);

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
    <>
      <div
        ref={comboboxAnchor}
        className={cn(
          "relative bg-slate-300 text-left dark:bg-slate-600",
          !combobox && "rounded",
          combobox && !focused && "rounded",
          combobox && focused && "rounded-t",
        )}
      >
        <div className={cn(combobox && "p-1")}>
          <div
            className={cn(
              combobox &&
                "rounded border-2 border-gray-200 dark:border-gray-800",
            )}
          >
            <PlainTextPlugin
              contentEditable={
                <ContentEditable
                  style={{ tabSize: 1 }}
                  className={cn(
                    "relative resize-none caret-gray-900 outline-none outline-0 dark:text-gray-100 dark:caret-gray-100",
                    combobox && "rounded-t px-2 py-3",
                    !combobox && "min-h-[150px] px-3 py-4",
                  )}
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
            {!combobox && (
              <BeautifulMentionsPlugin
                onSearch={handleSearch}
                searchDelay={asynchronous ? 250 : 0}
                triggers={Object.keys(mentionItems)}
                mentionEnclosure={mentionEnclosure}
                allowSpaces={allowSpaces}
                creatable={creatable}
                insertOnBlur={insertOnBlur}
                showMentionsOnDelete={showMentionsOnDelete}
                menuComponent={Menu}
                menuItemComponent={MenuItem}
              />
            )}
            {combobox && (
              <BeautifulMentionsPlugin
                onSearch={handleSearch}
                searchDelay={asynchronous ? 250 : 0}
                triggers={Object.keys(mentionItems)}
                mentionEnclosure={mentionEnclosure}
                allowSpaces={allowSpaces}
                creatable={creatable}
                insertOnBlur={insertOnBlur}
                showMentionsOnDelete={showMentionsOnDelete}
                combobox
                comboboxAnchor={comboboxAnchor.current}
                comboboxAnchorClassName="shadow-lg shadow-gray-900 rounded"
                comboboxComponent={Combobox}
                comboboxItemComponent={ComboboxItem}
              />
            )}
          </div>
        </div>
      </div>
      <MentionsToolbarPlugin />
      <div className="hidden" data-testid="plaintext">
        {value}
      </div>
    </>
  );
}
