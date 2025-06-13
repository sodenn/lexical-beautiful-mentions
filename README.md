# lexical-beautiful-mentions

[![CI status][github-ci-action-image]][github-ci-action-url]
[![CodeQL status][github-codeql-analysis-action-image]][github-codeql-analysis-action-url]

[github-ci-action-image]: https://github.com/sodenn/lexical-beautiful-mentions/actions/workflows/ci.yml/badge.svg
[github-ci-action-url]: https://github.com/sodenn/lexical-beautiful-mentions/actions/workflows/ci.yml
[github-codeql-analysis-action-image]: https://github.com/sodenn/lexical-beautiful-mentions/actions/workflows/codeql-analysis.yml/badge.svg
[github-codeql-analysis-action-url]: https://github.com/sodenn/lexical-beautiful-mentions/actions/workflows/codeql-analysis.yml

[Demo](https://lexical-beautiful-mentions-docs.vercel.app/)

A mentions plugin for the [lexical editor](https://lexical.dev/). lexical is an extendable text editor for the web build by Meta. While the lexical playground offers a basic mentions plugin for demo purposes, this plugin is more advanced and offers more features.

- **Customizable triggers**: Use characters, words or regular expressions as triggers for mentions.
- **Multiple triggers**: You can define multiple triggers (e.g. `@` and `#`).
- [Editing mentions outside the editor](#programmatically-insert-delete-or-rename-mentions): Programmatically insert, delete, or rename mentions via the `useBeautifulMentions` hook.
- **Automatic spacing**: The plugin automatically adds spaces around the mentions, which makes it easier for the user to continue typing.
- [Adding new mentions](#creating-new-mentions): You can allow users to create new mentions that are not in the suggestion list.
- [Async query function](#async-query-function): You can use an async query function to provide mentions for the suggestion list.
- [Additional metadata](#additional-metadata): You can add additional metadata to the mention items, which will be included in the mention nodes when serializing the editor content.
- [Customizable mention style](#customize-mention-style): You can change the look of the mentions via the editor theme to match the style of your application.
- [Custom menu and menu item](#custom-menu-and-menu-item-component): You can customize the look and behavior of the menu that displays the mention suggestions.
- [Custom mention component](#custom-mention-node-and-component): You can replace the default mention component with a custom component of your choice.

## Installation

To install the plugin, run the following command:

```bash
// with npm
npm install lexical-beautiful-mentions

// with yarn
yarn add lexical-beautiful-mentions
```

You also need to install the `lexical` and `@lexical/react`, which is a peer dependency of this plugin.

## Usage

Import the `BeautifulMentionsPlugin` plugin:

```tsx
import { BeautifulMentionsPlugin, BeautifulMentionNode } from "lexical-beautiful-mentions";
```

Add the plugin to the lexical editor:

```tsx
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

const mentionItems = {
  "@": ["Anton", "Boris", "Catherine", "Dmitri", "Elena", "Felix", "Gina"],
  "#": ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"],
  "due:": ["Today", "Tomorrow", "01-01-2023"],
};

const editorConfig = {
  // ...
  nodes: [BeautifulMentionNode] // 👈 register the mention node
};

return (
  <LexicalComposer initialConfig={editorConfig}>
    <RichTextPlugin // 👈 use the RichTextPlugin to get clipboard support for mentions
      contentEditable={/* ... */}
      placeholder={/* ... */}
      ErrorBoundary={/* ... */}
    />
    <BeautifulMentionsPlugin // 👈 add the mentions plugin
      items={mentionItems}
    />
    {/** ... */}
  </LexicalComposer>
);
```

### Customize mention style

<img src="https://raw.githubusercontent.com/sodenn/lexical-beautiful-mentions/main/resources/screenshot1.png" width="200"/><br>
```tsx
import { BeautifulMentionsTheme } from "lexical-beautiful-mentions";
// ...
const beautifulMentionsTheme: BeautifulMentionsTheme = {
  // 👇 use the trigger name as the key
  "@": "px-1 mx-px ...",
  // 👇 add the "Focused" suffix to style the focused mention
  "@Focused": "outline-none shadow-md ...",
  // 👇 use a class configuration object for advanced styling
  "due:": {
    trigger: "text-blue-400 ...",
    value: "text-orange-400 ...",
    container: "px-1 mx-px ...",
    containerFocused: "outline-none shadow-md ...",
  },
}
// 👇 add the mention theme to the editor theme
const editorConfig = {
  // ...
  theme: {
    // ...
    beautifulMentions: beautifulMentionsTheme,
  },
};

// ...

return (
  <LexicalComposer initialConfig={editorConfig}>
    {/** ... */}
  </LexicalComposer>
);
```

### Custom mention node and component

If applying styles via the theme is not enough, you can replace the BeautifulMentionNode by using the lexical [Node Overrides](https://lexical.dev/docs/concepts/node-replacement) API. This allows you to change the default behavior of the mention node:
```tsx
export class CustomMentionsNode extends BeautifulMentionNode {
  static getType() {
    return "custom-beautifulMention";
  }
  static clone(node: CustomBeautifulMentionNode) {
    // TODO: implement
  }
  static importJSON(serializedNode: SerializedBeautifulMentionNode) {
    // TODO: implement
  }
  exportJSON(): SerializedBeautifulMentionNode {
    // TODO: implement
  }
  component(): ElementType<BeautifulMentionComponentProps> | null {
    // the component that renders the mention in the editor
    // return null to use the default component
    // 💡 if you only want to replace the component use the `createBeautifulMentionNode` helper method. See below for more details 👇
  }
  decorate(editor: LexicalEditor, config: EditorConfig): React.JSX.Element {
    // TODO: implement
  }
}
const editorConfig = {
  // ...
  nodes: [
    // Don't forget to register your custom node separately!
    CustomMentionsNode,
    {
      replace: BeautifulMentionNode, 
      with: (node: BeautifulMentionNode) => {
        return new CustomMentionsNode(
          node.getTrigger(),
          node.getValue(),
          node.getData(),
        );
      }
    }
  ]
}
```

The plugin also provides a helper method that overrides the default `BeautifulMentionNode` and uses a customized version with a component of your choice:

```tsx
const CustomMentionComponent = forwardRef<
  HTMLDivElement,
  BeautifulMentionComponentProps<MyData>
>(({ trigger, value, data: myData, children, ...other }, ref) => {
  return (
    <div {...other} ref={ref} title={trigger + value}>
      {value}
    </div>
  );
});
const editorConfig = {
  // ...
  nodes: [...createBeautifulMentionNode(CustomMentionComponent)],
};
```

###  Custom menu and menu item component

<img src="https://raw.githubusercontent.com/sodenn/lexical-beautiful-mentions/main/resources/screenshot2.png" width="500"/><br>
```tsx
function CustomMenu({ loading, ...props }: BeautifulMentionsMenuProps) {
  <ul
    className="m-0 mt-6 ..."
    {...props}
  />
}

const CustomMenuItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
>(({ selected, item, ...props }, ref) => (
  <li
    className={`m-0 flex ... ${selected ? "bg-gray-100 ..." : "bg-white ..."}`}
    {...props}
    ref={ref}
  />
));

// ...

<BeautifulMentionsPlugin
  items={mentionItems}
  menuComponent={CustomMenu}
  menuItemComponent={CustomMenuItem}
/>
```

### Additional metadata

Additional metadata can be used to uniquely identify mentions by adding an `id` or any other unique property to the mention items. When serializing the editor content, the metadata will be included in the mention nodes:

```tsx
const mentionItems = {
  "@": [
    { value: "Catherine", id: "1", email: "catherine.a@example.com" },
    { value: "Catherine", id: "2", email: "catherine.b@example.com" },
    // ...
  ],
};
```

Serializes to the following lexical nodes:
```json
 [
   {
     "trigger": "@",
     "value": "Catherine",
     "data": {
       "id": "1",
       "email": "catherine.a@example.com"
     },
     "type": "beautifulMention",
     "version": 1
   },
   {
     "trigger": "@",
     "value": "Catherine",
     "data": {
       "id": "2",
       "email": "catherine.b@example.com"
     },
     "type": "beautifulMention",
     "version": 1
   }
 ]
```

All additional metadata are available as props of the `BeautifulMentionsMenuItem` component:

```tsx
const CustomMenuItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
>(({ item: { data: { id, email }}, ...props }, ref) => (
 <li
  // ...
 />
));
```

### Empty state

The plugin allows you to display a custom component when the mention menu is empty and no search results are found:

```tsx
const Empty = () => (
  <div className="top-[2px] m-0 min-w-[10rem] overflow-hidden ...">
    No results found.
  </div>
);

// ...

<BeautifulMentionsPlugin
  // ...
  menuComponent={CustomMenu}
  menuItemComponent={CustomMenuItem}
  emptyComponent={Empty} // 👈
/>
```

### Programmatically insert, delete, or rename mentions

```tsx
import {
  BeautifulMentionsPlugin,
  useBeautifulMentions,
} from "lexical-beautiful-mentions";

// ...

function MentionsToolbar() {
  const { removeMentions, insertMention } = useBeautifulMentions();
  return (
    <div className="grid gap-2 grid-cols-2">
      <Button onClick={() => removeMentions({ trigger: "#", value: "urgent" })}>
        Remove Mention
      </Button>
      <Button onClick={() => insertMention({ trigger: "#", value: "work" })}>
        Insert Mention
      </Button>
    </div>
  );
}

// ...

return (
  <LexicalComposer>
    {/** ... */}
    <BeautifulMentionsPlugin
      items={mentionItems}
    />
    <MentionsToolbar />
    {/** ... */}
  </LexicalComposer>
);
```

### Creating new mentions

By default, the plugin allows users to create new mentions that are not in the suggestion list.

Customize the text of the menu item that allows users to create new mentions:

```tsx
<BeautifulMentionsPlugin
  items={mentionItems}
  creatable={`Add user "{{name}}"`} // 👈 the `{{name}}` placeholder contains the current search query
/>
```

Hide the menu item that allows users to create new mentions:

```tsx
<BeautifulMentionsPlugin
  items={mentionItems}
  creatable={false} // 👈 hide the menu item that allows users to create new mentions
/>
```

Hide the menu item that allows users to create new mentions for specific triggers, while enabling it for other triggers:

```tsx

<BeautifulMentionsPlugin
  items={mentionItems}
  creatable={{ "@": `Add user "{{name}}"`, "#": false }} // 👈 allow creating "@" mentions but not "#" mentions
/>
```

### Async query function

```tsx
const queryMentions = async (trigger: string, query: string) => {
  const response = await fetch(
    `https://example.com/api/mentions?trigger=${trigger}&query=${query}`
  );
  const data = await response.json();
  return data as string[];
};

// ...

return (
  <LexicalComposer>
    {/** ... */}
    <BeautifulMentionsPlugin
      triggers={["@", "#"]} // needed to tell the plugin when to call the query function
      onSearch={queryMentions}
    />
    {/** ... */}
  </LexicalComposer>
);
```

### Mention Detection

You can customize the regular expression that looks for mentions in your text by using the `punctuation` and `preTriggerChars` properties.

#### Punctuation

The `punctuation` property allows you to specify the punctuation characters that can appear directly after a mention. So that you can type for example `@Alice.` **without the dot** being part of the mention. The default value contains a common set of [punctuation characters](https://github.com/sodenn/lexical-beautiful-mentions/blob/eb6b1a3e1c642c77634d586ebceaf44d00cbbdfc/plugin/src/mention-utils.ts#L48).

#### PreTriggerChars

The `preTriggerChars` property allows you to specify a set of characters that can appear directly before the trigger character. By default, only the open bracket is allowed (e.g. `(@Alice)`).

### Utility Functions for Mention Conversion

The plugin provides two utility functions to help with converting text to mention nodes:

#### `$convertToMentionNodes`

This function converts a string or a text node into a list of mention and text nodes.

Usage example:

```typescript
import { $convertToMentionNodes } from 'lexical-beautiful-mentions';

const text = "Hello @Alice and #world";
const nodes = $convertToMentionNodes(text, ['@', '#']);
// nodes will be an array of TextNodes and BeautifulMentionNodes
```

#### `$transformTextToMentionNodes`

This function transforms text nodes in the editor that contain mention strings into mention nodes.

Usage example:

```typescript
import { $transformTextToMentionNodes } from 'lexical-beautiful-mentions';

editor.update(() => {
  $transformTextToMentionNodes(['@', '#']);
});
```

**Note:** Both functions only work for mentions without spaces. Ensure spaces are disabled via the `allowSpaces` prop.
