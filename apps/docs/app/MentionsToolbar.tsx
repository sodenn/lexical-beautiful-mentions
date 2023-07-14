import { useBeautifulMentions } from "lexical-beautiful-mentions";
import { useCallback } from "react";
import Button from "./Button";
import Checkbox, { CheckboxProps } from "./Checkbox";
import { useConfiguration } from "./ConfigurationProvider";

function getRandomItem<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export default function MentionsToolbar() {
  const {
    openMentionsMenu,
    renameMentions,
    removeMentions,
    insertMention,
    getMentions,
  } = useBeautifulMentions();
  const {
    asynchronous,
    showTriggers,
    showMentionsOnDelete,
    allowSpaces,
    creatable,
    insertOnBlur,
    commandFocus,
    setAsynchronous,
    setShowTriggers,
    setAllowSpaces,
    setCreatable,
    setInsertOnBlur,
    setShowMentionsOnDelete,
  } = useConfiguration();

  const handleRemoveMentions = useCallback(() => {
    const mentions = getMentions();
    if (!mentions.length) {
      return;
    }
    const randomMention = getRandomItem(mentions);
    removeMentions({
      trigger: randomMention.trigger,
      value: randomMention.value,
      focus: commandFocus,
    });
  }, [commandFocus, getMentions, removeMentions]);

  const handleAsynchronousChange: CheckboxProps["onChange"] = useCallback(
    (event) => {
      setAsynchronous(event.target.checked);
    },
    [setAsynchronous],
  );

  const handleAllowSpacesChange: CheckboxProps["onChange"] = useCallback(
    (event) => {
      setAllowSpaces(event.target.checked);
    },
    [setAllowSpaces],
  );

  const handleShowTriggersChange: CheckboxProps["onChange"] = useCallback(
    (event) => {
      setShowTriggers(event.target.checked);
    },
    [setShowTriggers],
  );

  const handleShowMentionsOnDelete: CheckboxProps["onChange"] = useCallback(
    (event) => {
      setShowMentionsOnDelete(event.target.checked);
    },
    [setShowMentionsOnDelete],
  );

  const handleCreatableChange: CheckboxProps["onChange"] = useCallback(
    (event) => {
      setCreatable(event.target.checked);
    },
    [setCreatable],
  );

  const handleInsertOnBlurChange: CheckboxProps["onChange"] = useCallback(
    (event) => {
      setInsertOnBlur(event.target.checked);
    },
    [setInsertOnBlur],
  );

  return (
    <>
      <div className="my-3 grid grid-cols-2 gap-1 sm:gap-2">
        <Button onClick={() => openMentionsMenu({ trigger: "@" })}>
          Open Suggestions
        </Button>
        <Button
          onClick={() =>
            renameMentions({
              trigger: "due:",
              newValue: "today",
              focus: commandFocus,
            })
          }
        >
          Rename Mention
        </Button>
        <Button onClick={handleRemoveMentions}>Remove Mention</Button>
        <Button
          onClick={() =>
            insertMention({
              trigger: "#",
              value: "work",
              focus: commandFocus,
            })
          }
        >
          Insert Mention
        </Button>
      </div>
      <div className="my-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="text-slate-950 dark:text-gray-200 sm:col-span-2">
          Flags
        </div>
        <Checkbox
          label="allowSpaces"
          helpText="Mentions can contain spaces."
          checked={allowSpaces}
          onChange={handleAllowSpacesChange}
        />
        <Checkbox
          label="creatable"
          helpText="The user can add new mentions instead of just selecting from a list of predefined mentions."
          checked={!!creatable}
          onChange={handleCreatableChange}
        />
        <Checkbox
          label="insertOnBlur"
          helpText="The mention will be inserted when the editor loses the focus."
          checked={insertOnBlur}
          onChange={handleInsertOnBlurChange}
        />
        <Checkbox
          label="showMentionsOnDelete"
          helpText="Shows the mention menu when the user deletes a mention."
          checked={showMentionsOnDelete}
          onChange={handleShowMentionsOnDelete}
        />
        <hr className="my-1 h-px border-0 bg-gray-300 dark:bg-gray-600 sm:col-span-2" />
        <Checkbox
          label="Asynchronous"
          helpText="Simulate asynchronous loading of mention suggestions."
          checked={asynchronous}
          onChange={handleAsynchronousChange}
        />
        <Checkbox
          label="showTriggers"
          helpText="Shows the available triggers when ctrl+space is pressed."
          checked={showTriggers}
          onChange={handleShowTriggersChange}
        />
      </div>
    </>
  );
}
