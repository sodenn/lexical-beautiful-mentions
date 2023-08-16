"use client"; // prettier-ignore
import { defaultInitialValue } from "@/lib/editor-config";
import useQueryParams, { QueryParam } from "@/lib/useQueryParams";
import { sanitize } from "dompurify";
import { BeautifulMentionsPluginProps } from "lexical-beautiful-mentions";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface Configuration
  extends Pick<
    BeautifulMentionsPluginProps,
    "allowSpaces" | "creatable" | "insertOnBlur"
  > {
  initialValue: string;
  autoFocus: "rootStart" | "rootEnd" | "none";
  asynchronous: boolean;
  commandFocus: boolean;
  combobox: boolean;
  comboboxAdditionalItems: boolean;
  mentionEnclosure?: string;
  showMentionsOnDelete: boolean;
  setAllowSpaces: (allowSpaces: boolean) => void;
  setCreatable: (creatable: boolean) => void;
  setInsertOnBlur: (insertOnBlur: boolean) => void;
  setMentionEnclosure: (mentionEnclosure: boolean) => void;
  setAsynchronous: (asynchronous: boolean) => void;
  setCombobox: (combobox: boolean) => void;
  setComboboxAdditionalItems: (comboboxAdditionalItems: boolean) => void;
  setShowMentionsOnDelete: (showMentionsOnDelete: boolean) => void;
}

const ConfigurationCtx = createContext<Configuration>(undefined);

const creatableMap = {
  "@": 'Add user "{{name}}"',
  "#": 'Add tag "{{name}}"',
  "due:": 'Add due date "{{name}}"',
  "rec:": 'Add recurrence "{{name}}"',
};

const ConfigurationProvider = ({ children }: PropsWithChildren) => {
  const { setQueryParams, hasQueryParams, getQueryParam } = useQueryParams();
  const [asynchronous, _setAsynchronous] = useState(
    getQueryParam("async") === "true",
  );
  const [allowSpaces, _setAllowSpaces] = useState(
    getQueryParam("space") === "true",
  );
  const [creatable, _setCreatable] = useState(getQueryParam("new") === "true");
  const [insertOnBlur, _setInsertOnBlur] = useState(
    getQueryParam("blur") === "true",
  );
  const [combobox, _setCombobox] = useState(
    getQueryParam("combobox") === "true",
  );
  const [comboboxAdditionalItems, _setComboboxAdditionalItems] = useState(
    getQueryParam("cbai") === "true",
  );
  const [mentionEnclosure, _setMentionEnclosure] = useState(
    getQueryParam("enclosure") === "true",
  );
  const [showMentionsOnDelete, _setShowMentionsOnDelete] = useState(
    getQueryParam("mentions") === "true",
  );
  const commandFocus = getQueryParam("cf") !== "false";
  const focusParam = getQueryParam("focus");
  const valueParam = getQueryParam("value");
  const hasValue = hasQueryParams("value");
  const initialValue =
    sanitize(valueParam) || (hasValue ? "" : defaultInitialValue);
  const autoFocus: "rootStart" | "rootEnd" | "none" =
    focusParam === "start"
      ? "rootStart"
      : focusParam === "none"
      ? "none"
      : "rootEnd";

  const setAsynchronous = useCallback(
    (asynchronous: boolean) => {
      _setAsynchronous(asynchronous);
      setQueryParams([{ name: "async", value: asynchronous.toString() }]);
    },
    [setQueryParams],
  );

  const setCombobox = useCallback(
    (combobox: boolean) => {
      _setCombobox(combobox);
      const newParams: QueryParam[] = [
        { name: "combobox", value: combobox.toString() },
      ];
      if (combobox && insertOnBlur) {
        _setInsertOnBlur(false);
        newParams.push({ name: "blur", value: "false" });
      }
      if (!combobox && comboboxAdditionalItems) {
        _setComboboxAdditionalItems(false);
        newParams.push({
          name: "cbai",
          value: "false",
        });
      }
      setQueryParams(newParams);
    },
    [comboboxAdditionalItems, insertOnBlur, setQueryParams],
  );

  const setComboboxAdditionalItems = useCallback(
    (comboboxAdditionalItems: boolean) => {
      _setComboboxAdditionalItems(comboboxAdditionalItems);
      setQueryParams([
        { name: "cbai", value: comboboxAdditionalItems.toString() },
      ]);
    },
    [setQueryParams],
  );

  const setMentionEnclosure = useCallback(
    (mentionEnclosure: boolean) => {
      _setMentionEnclosure(mentionEnclosure);
      setQueryParams([
        { name: "enclosure", value: mentionEnclosure.toString() },
      ]);
    },
    [setQueryParams],
  );

  const setShowMentionsOnDelete = useCallback(
    (showMentionsOnDelete: boolean) => {
      _setShowMentionsOnDelete(showMentionsOnDelete);
      setQueryParams([
        { name: "mentions", value: showMentionsOnDelete.toString() },
      ]);
    },
    [setQueryParams],
  );

  const setAllowSpaces = useCallback(
    (allowSpaces: boolean) => {
      _setAllowSpaces(allowSpaces);
      setQueryParams([{ name: "space", value: allowSpaces.toString() }]);
    },
    [setQueryParams],
  );

  const setCreatable = useCallback(
    (creatable: boolean) => {
      _setCreatable(creatable);
      setQueryParams([{ name: "new", value: creatable.toString() }]);
    },
    [setQueryParams],
  );

  const setInsertOnBlur = useCallback(
    (insertOnBlur: boolean) => {
      _setInsertOnBlur(insertOnBlur);
      setQueryParams([{ name: "blur", value: insertOnBlur.toString() }]);
    },
    [setQueryParams],
  );

  const value = useMemo(
    () => ({
      initialValue,
      autoFocus,
      asynchronous,
      combobox,
      comboboxAdditionalItems,
      setComboboxAdditionalItems,
      mentionEnclosure: mentionEnclosure ? '"' : undefined,
      showMentionsOnDelete,
      allowSpaces,
      creatable: creatable ? creatableMap : false,
      insertOnBlur,
      setAsynchronous,
      setAllowSpaces,
      setCreatable,
      setInsertOnBlur,
      setCombobox,
      setMentionEnclosure,
      setShowMentionsOnDelete,
      commandFocus,
    }),
    [
      allowSpaces,
      asynchronous,
      autoFocus,
      combobox,
      comboboxAdditionalItems,
      commandFocus,
      creatable,
      initialValue,
      insertOnBlur,
      mentionEnclosure,
      setAllowSpaces,
      setAsynchronous,
      setCombobox,
      setComboboxAdditionalItems,
      setCreatable,
      setInsertOnBlur,
      setMentionEnclosure,
      setShowMentionsOnDelete,
      showMentionsOnDelete,
    ],
  );

  return (
    <ConfigurationCtx.Provider value={value}>
      {children}
    </ConfigurationCtx.Provider>
  );
};

export function useConfiguration() {
  const context = useContext(ConfigurationCtx);
  if (context === undefined) {
    throw new Error(
      "useConfiguration must be used within a ConfigurationProvider",
    );
  }
  return context;
}

export default ConfigurationProvider;
