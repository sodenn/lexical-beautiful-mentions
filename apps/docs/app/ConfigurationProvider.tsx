"use client"; // prettier-ignore
import { sanitize } from "dompurify";
import { BeautifulMentionsPluginProps } from "lexical-beautiful-mentions";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { defaultInitialValue } from "./editorConfig";
import useQueryParams from "./useQueryParams";

interface Configuration
  extends Pick<
    BeautifulMentionsPluginProps,
    "allowSpaces" | "creatable" | "insertOnBlur"
  > {
  initialValue: string;
  autoFocus: "rootStart" | "rootEnd" | "none";
  asynchronous: boolean;
  commandFocus: boolean;
  showTriggersShortcut: boolean;
  setAsynchronous: (asynchronous: boolean) => void;
  setAllowSpaces: (allowSpaces: boolean) => void;
  setCreatable: (creatable: boolean) => void;
  setInsertOnBlur: (insertOnBlur: boolean) => void;
  setShowTriggersShortcut: (showTriggersShortcut: boolean) => void;
}

const ConfigurationCtx = createContext<Configuration>(undefined);

const ConfigurationProvider = ({ children }: PropsWithChildren) => {
  const { updateQueryParam, hasQueryParams, getQueryParam } = useQueryParams();
  const [asynchronous, _setAsynchronous] = useState(
    getQueryParam("async") === "true"
  );
  const [allowSpaces, _setAllowSpaces] = useState(
    getQueryParam("space") === "true"
  );
  const [creatable, _setCreatable] = useState(getQueryParam("new") === "true");
  const [insertOnBlur, _setInsertOnBlur] = useState(
    getQueryParam("blur") === "true"
  );
  const [showTriggersShortcut, _setShowTriggersShortcut] = useState(
    getQueryParam("triggers") === "true"
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
      updateQueryParam("async", asynchronous);
    },
    [updateQueryParam],
  );

  const setShowTriggersShortcut = useCallback(
    (showTriggersShortcut: boolean) => {
      _setShowTriggersShortcut(showTriggersShortcut);
      updateQueryParam("triggers", showTriggersShortcut);
    },
    [updateQueryParam]
  );

  const setAllowSpaces = useCallback(
    (allowSpaces: boolean) => {
      _setAllowSpaces(allowSpaces);
      updateQueryParam("space", allowSpaces);
    },
    [updateQueryParam],
  );

  const setCreatable = useCallback(
    (creatable: boolean) => {
      _setCreatable(creatable);
      updateQueryParam("new", creatable);
    },
    [updateQueryParam],
  );

  const setInsertOnBlur = useCallback(
    (insertOnBlur: boolean) => {
      _setInsertOnBlur(insertOnBlur);
      updateQueryParam("blur", insertOnBlur);
    },
    [updateQueryParam],
  );

  return (
    <ConfigurationCtx.Provider
      value={{
        initialValue,
        autoFocus,
        asynchronous,
        showTriggersShortcut,
        allowSpaces,
        creatable,
        insertOnBlur,
        setAsynchronous,
        setAllowSpaces,
        setCreatable,
        setInsertOnBlur,
        setShowTriggersShortcut,
        commandFocus,
      }}
    >
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
