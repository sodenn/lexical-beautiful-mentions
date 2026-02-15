# AI Coding Agent Instructions for lexical-beautiful-mentions

## Project Overview

A React plugin for the Lexical text editor that enables rich mention functionality (@mentions, #hashtags, custom triggers). The codebase is organized as a monorepo with:

- **`plugin/`** - The mention plugin (published to npm)
- **`www/`** - Next.js demo site showcasing the plugin features
- **Root scripts** - Monorepo orchestration via Turborepo

## Architecture & Key Concepts

### Two Operational Modes

1. **Menu Mode** (default): Uses Lexical's `LexicalTypeaheadMenuPlugin` with traditional dropdown
2. **Combobox Mode**: Custom two-stage combobox showing triggers first, then values (see `ComboboxPlugin.tsx`)

### Core Data Flow

- **Triggers** (`@`, `#`, `due:`, etc.) are registered via `items` (static map) or `onSearch` (async function)
- **Mention detection** uses regex patterns defined in `mention-utils.ts` (`createMentionsRegex`, `checkForMentions`)
- **Lexical nodes** (`BeautifulMentionNode`) extend `DecoratorNode` to persist mention metadata in editor state
- **Theme system** supports per-trigger styling via CSS classes (see `theme.ts`)

### Three Levels of Customization

1. **Styling**: CSS theme classes for mentions (e.g., `beautifulMentions["@"]`)
2. **Components**: Replace menu/menu-item/mention components with custom React components
3. **Node override**: Replace entire `BeautifulMentionNode` behavior via `createBeautifulMentionNode()`

## Common Developer Tasks

### Running the Monorepo

- `npm run dev` - Start both plugin and www in watch mode
- `npm run build` - Build plugin (ESM + CJS) and next app
- `npm run test` - Run Vitest unit tests in plugin
- `npm run e2e` - Run Playwright tests against www demo
- `npm run hygiene` - Typecheck, lint, format all code
- `npm run lint` - Lint with ESLint
- `npm run fmt` - Check formatting with Prettier

### Adding Features to the Plugin

1. **New prop**: Add to `BeautifulMentionsPluginProps.ts` (discriminated union by mode: menu vs combobox)
2. **Regex behavior**: Modify `mention-utils.ts` patterns (e.g., allowed chars, trigger format)
3. **Hook**: Add to `useBeautifulMentions()` for programmatic control
4. **Command**: Define in `mention-commands.ts` and register in `BeautifulMentionsPlugin.tsx`

### Testing Strategy

- **Unit tests**: Vitest with `happy-dom` environment (see `vitest.config.ts`)
- **E2E tests**: Playwright against www demo for real browser interaction
- **Patterns**:
  - Unit: test mention detection regex, node serialization, utility functions
  - E2E: test editor interactions, menu positioning, keyboard navigation

## Git & Changesets Workflow

- Branches: `[type/scope]` convention (e.g., `feat/multiple-triggers`, `fix/mobile-menu`)
- Commits: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Changesets: Used for versioning (see `plugin/CHANGELOG.md`, `.changeset/` directory)
