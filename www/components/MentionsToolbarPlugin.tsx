import { useConfiguration } from "@/components/ConfigurationProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Separator } from "@/components/ui/Separator";
import { CheckboxProps } from "@radix-ui/react-checkbox";
import { useBeautifulMentions } from "lexical-beautiful-mentions";
import { useCallback, useId } from "react";

function getRandomItem<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

interface ToolbarCheckboxProps {
  label: string;
  helperText: string;
  checked: boolean;
  onCheckedChange: CheckboxProps["onCheckedChange"];
}

function ToolbarCheckbox({
  label,
  helperText,
  checked,
  onCheckedChange,
}: ToolbarCheckboxProps) {
  const id = useId();
  return (
    <div className="items-top flex space-x-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <div className="grid cursor-pointer gap-1.5 leading-none">
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          <p className="pt-1 text-sm font-normal text-muted-foreground">
            {helperText}
          </p>
        </label>
      </div>
    </div>
  );
}

export function MentionsToolbarPlugin() {
  const {
    openMentionMenu,
    renameMentions,
    removeMentions,
    insertMention,
    getMentions,
  } = useBeautifulMentions();
  const {
    asynchronous,
    combobox,
    comboboxAdditionalItems,
    mentionEnclosure,
    showMentionsOnDelete,
    allowSpaces,
    creatable,
    insertOnBlur,
    commandFocus,
    setAsynchronous,
    setCombobox,
    setComboboxAdditionalItems,
    setMentionEnclosure,
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

  return (
    <Card className="mt-2 flex flex-col gap-3 p-2">
      <div className="grid grid-cols-2 gap-1 sm:gap-2">
        <Button
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openMentionMenu({ trigger: "@" })}
        >
          Open Suggestions
        </Button>
        <Button
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
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
        <Button
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleRemoveMentions}
        >
          Remove Mention
        </Button>
        <Button
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="text-muted-foreground sm:col-span-2">Flags</div>
        <ToolbarCheckbox
          label="allowSpaces"
          checked={allowSpaces}
          helperText="Mentions can contain spaces."
          onCheckedChange={setAllowSpaces}
        />
        <ToolbarCheckbox
          label="creatable"
          checked={!!creatable}
          helperText="The user can add new mentions instead of just selecting from a list of predefined mentions."
          onCheckedChange={setCreatable}
        />
        {!combobox && (
          <ToolbarCheckbox
            label="insertOnBlur"
            checked={insertOnBlur}
            helperText="The mention will be inserted when the editor loses the focus."
            onCheckedChange={setInsertOnBlur}
          />
        )}
        <ToolbarCheckbox
          label="showMentionsOnDelete"
          checked={showMentionsOnDelete}
          helperText="Shows the mention menu when the user deletes a mention."
          onCheckedChange={setShowMentionsOnDelete}
        />
        <ToolbarCheckbox
          label="combobox"
          checked={combobox}
          helperText="Use a combobox instead of a menu."
          onCheckedChange={setCombobox}
        />
        <Separator className="my-1 sm:col-span-2" />
        <ToolbarCheckbox
          label="asynchronous"
          checked={asynchronous}
          helperText="Simulate asynchronous loading of mention suggestions."
          onCheckedChange={setAsynchronous}
        />
        <ToolbarCheckbox
          label="mentionEnclosure"
          checked={!!mentionEnclosure}
          helperText="Enclose mentions with quotes if they contain spaces. The characters used to enclose the mentions are configurable."
          onCheckedChange={setMentionEnclosure}
        />
        {combobox && (
          <ToolbarCheckbox
            label="Additional Items"
            checked={comboboxAdditionalItems}
            helperText="Add additional items to the combobox."
            onCheckedChange={setComboboxAdditionalItems}
          />
        )}
      </div>
    </Card>
  );
}
