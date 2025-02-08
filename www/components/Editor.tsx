"use client"; // prettier-ignore
import { Combobox, ComboboxItem } from "@/components/Combobox";
import { useConfiguration } from "@/components/ConfigurationProvider";
import { Empty } from "@/components/Empty";
import { MentionsToolbarPlugin } from "@/components/MentionsToolbarPlugin";
import { Menu, MenuItem } from "@/components/Menu";
import { Placeholder } from "@/components/Placeholder";
import editorConfig from "@/lib/editor-config";
import { getDebugTextContent, useIsFocused } from "@/lib/editor-utils";
import { cn } from "@/lib/utils";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, EditorState } from "lexical";
import {
  BeautifulMentionsComboboxItem,
  BeautifulMentionsItem,
  BeautifulMentionsPlugin,
  BeautifulMentionsPluginProps,
} from "lexical-beautiful-mentions";
import { useCallback, useMemo, useRef, useState } from "react";
import "./Editor.css";

const mentionItems: Record<string, BeautifulMentionsItem[]> = {
  "@": [
    "Anton",
    "Boris",
    "Catherine",
    "Dmitri",
    "Elena",
    "Felix",
    { value: "Gina", id: "1", avatar: null },
    { value: "Gina", id: "2", avatar: "https://example.com/avatars/1.jpg" },
  ],
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
  const { initialValue, customMentionNode } = useConfiguration();
  return (
    <div className="mt-5 w-full max-w-2xl">
      <LexicalComposer
        initialConfig={editorConfig(
          Object.keys(mentionItems),
          initialValue,
          customMentionNode,
        )}
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
    autoSpace,
    allowSpaces,
    creatable,
    insertOnBlur,
    combobox,
    mentionEnclosure,
    showMentionsOnDelete,
    emptyComponent,
    comboboxAdditionalItems: _comboboxAdditionalItems,
  } = useConfiguration();
  const comboboxAnchor = useRef<HTMLDivElement>(null);
  const [menuOrComboboxOpen, setMenuOrComboboxOpen] = useState(false);
  const [comboboxItemSelected, setComboboxItemSelected] = useState(false);
  const focused = useIsFocused();
  const triggers = useMemo(
    () =>
      combobox
        ? Object.keys(mentionItems).filter((k) => k !== "\\w+:")
        : Object.keys(mentionItems),
    [combobox],
  );
  const comboboxAdditionalItems = useMemo(
    () =>
      _comboboxAdditionalItems
        ? [
            {
              value: "additionalItem",
              displayValue: "Additional Item",
              data: { dividerTop: true },
            },
          ]
        : [],
    [_comboboxAdditionalItems],
  );

  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const value = getDebugTextContent(root);
      setValue(value);
    });
  }, []);

  const handleSearch = useCallback(
    (trigger: string, queryString: string) =>
      queryMentions(trigger, queryString, asynchronous),
    [asynchronous],
  );

  const handleMenuOrComboboxOpen = useCallback(() => {
    setMenuOrComboboxOpen(true);
  }, []);

  const handleMenuOrComboboxClose = useCallback(() => {
    setMenuOrComboboxOpen(false);
  }, []);

  const handleComboboxFocusChange = useCallback(
    (item: BeautifulMentionsComboboxItem | null) => {
      setComboboxItemSelected(item !== null);
    },
    [],
  );

  const handleComboboxItemSelect = useCallback(
    (item: BeautifulMentionsComboboxItem) => {
      if (item.itemType === "additional") {
        setMenuOrComboboxOpen(false);
      }
    },
    [],
  );

  const beautifulMentionsProps: BeautifulMentionsPluginProps = {
    mentionEnclosure,
    allowSpaces,
    autoSpace,
    creatable,
    showMentionsOnDelete,
    ...(asynchronous
      ? {
          onSearch: handleSearch,
          searchDelay: 250,
          triggers,
        }
      : {
          items: mentionItems,
        }),
    ...(combobox
      ? {
          combobox,
          triggers,
          comboboxOpen: menuOrComboboxOpen,
          comboboxAnchor: comboboxAnchor.current,
          comboboxAnchorClassName:
            "ring-2 ring-ring ring-offset-2 ring-offset-background rounded-md",
          comboboxComponent: Combobox,
          comboboxItemComponent: ComboboxItem,
          onComboboxOpen: handleMenuOrComboboxOpen,
          onComboboxClose: handleMenuOrComboboxClose,
          onComboboxFocusChange: handleComboboxFocusChange,
          comboboxAdditionalItems,
          onComboboxItemSelect: handleComboboxItemSelect,
        }
      : {
          menuComponent: Menu,
          menuItemComponent: MenuItem,
          emptyComponent: emptyComponent ? Empty : undefined,
          onMenuOpen: handleMenuOrComboboxOpen,
          onMenuClose: handleMenuOrComboboxClose,
          insertOnBlur,
        }),
  };

  return (
    <>
      <div
        ref={comboboxAnchor}
        className={cn(
          "relative text-left",
          !combobox && "rounded",
          combobox && !menuOrComboboxOpen && "rounded",
          combobox && menuOrComboboxOpen && "rounded-t",
        )}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              style={{ tabSize: 1 }}
              className={cn(
                "border-input bg-background ring-offset-background placeholder:text-muted-foreground relative z-1 w-full flex-1 rounded-md border px-3 py-2",
                !combobox && "min-h-[5rem]",
                focused &&
                  !combobox &&
                  "ring-ring ring-2 ring-offset-2 outline-hidden",
                focused && combobox && "outline-hidden",
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
        <BeautifulMentionsPlugin {...beautifulMentionsProps} />
      </div>
      <MentionsToolbarPlugin />
      <div className="hidden" data-testid="plaintext">
        {value}
      </div>
      <div className="hidden" data-testid="menu-combobox-open">
        {menuOrComboboxOpen.toString()}
      </div>
      <div className="hidden" data-testid="combobox-item-selected">
        {comboboxItemSelected.toString()}
      </div>
    </>
  );
}
