# lexical-beautiful-mentions

[![CI status][github-ci-action-image]][github-ci-action-url]
[![CodeQL status][github-codeql-analysis-action-image]][github-codeql-analysis-action-url]

[github-ci-action-image]: https://github.com/sodenn/lexical-beautiful-mentions/actions/workflows/ci.yml/badge.svg
[github-ci-action-url]: https://github.com/sodenn/lexical-beautiful-mentions/actions/workflows/ci.yml
[github-codeql-analysis-action-image]: https://github.com/sodenn/lexical-beautiful-mentions/actions/workflows/codeql-analysis.yml/badge.svg
[github-codeql-analysis-action-url]: https://github.com/sodenn/lexical-beautiful-mentions/actions/workflows/codeql-analysis.yml

A mentions plugin for the lexical editor. lexical is an extendable text editor for the web build by Meta. While the lexical playground offers a basic mentions plugin for demo purposes, this plugin is more advanced and offers the following features:

- **Customizable triggers**: Use characters, words or regular expressions as triggers for mentions.
- **Editing mentions outside the editor**: Programmatically insert, delete, or rename mentions via the `useBeautifulMentions` hook.
- **Customizable mention style**: You can change the look of the mentions via the editor theme to match the style of your application.
- **Automatic spacing**: The plugin automatically adds spaces around the mentions, which makes it easier for the user to continue typing.
- **Adding new mentions**: You can allow users to create new mentions that are not in the suggestion list.
- **Flexible way to provide mentions**: You can use an async query function or a predefined list to provide mentions for the suggestion list.
- **Custom menu and menu item**: You can customize the look and behavior of the menu that displays the mention suggestions.
- **Additional metadata**: You can add additional metadata to the mention items, which will be included in the mention nodes when serializing the editor content.
- **Custom mention component**: You can replace the default mention component with a custom component of your choice.

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
    {/** ... */}
    <BeautifulMentionsPlugin
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
  // 👇 use a configuration object if you need to apply different styles to trigger and value
  "due:": {
    trigger: "text-blue-400 ...",
    value: "text-orange-400 ...",
  },
}
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
>(({ trigger, value, children, data: myData, ...other }, ref) => {
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
const CustomMenu = forwardRef<
  HTMLElement, 
  BeautifulMentionsMenuProps
>(({ open, loading, ...props }, ref) => (
  <ul
    className="m-0 mt-6 ..."
    {...props}
    ref={ref}
  />
));

const CustomMenuItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
>(({ selected, label, itemValue, ...props }, ref) => (
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
// serializes to the following lexical nodes:
// [
//   {
//     "trigger": "@",
//     "value": "Catherine",
//     "data": {
//       "id": "1",
//       "email": "catherine.a@example.com"
//     },
//     "type": "beautifulMention",
//     "version": 1
//   },
//   {
//     "trigger": "@",
//     "value": "Catherine",
//     "data": {
//       "id": "2",
//       "email": "catherine.b@example.com"
//     },
//     "type": "beautifulMention",
//     "version": 1
//   }
// ]
```

All additional metadata are available as props of the `BeautifulMentionsMenuItem` component:

```tsx
const CustomMenuItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
>(({ id, email, ...props }, ref) => (
 <li
  // ...
 />
));
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
