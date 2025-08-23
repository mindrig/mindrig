# Mind Control Code

Mind Control Code is an editor companion that helps to work on, test (in a playground and using evals) defined in source code. Right now it's in progress, so now all features planned are implemented.

## Project Structure

This is a monorepo with the following packages:

### [`vscode/extension`](./vscode/extension/)

VS Code extension package containing the main extension logic and webview provider.

**Stack:**

- TypeScript
- VS Code Extension API
- Vite as the bundler
- vscode-test (extension integration tests)

### [`vscode/webview`](./vscode/webview/)

React webview application that provides the UI for the Mind Control Code panel.

**Stack:**

- TypeScript
- React 18
- Vite as the bundler
- Tailwind CSS
- PostCSS

## Build Architecture

The project uses a two-package architecture with isolated dependencies:

- **Extension package**: Builds Node.js/CommonJS code for VS Code extension host
- **Webview package**: Builds React app as ES modules for webview display
- **Build output**: Webview builds into `extension/dist/webview/`, extension builds into `extension/dist/extension/`
- **Distribution**: Extension package contains both outputs for VS Code marketplace

### Build Commands

From the root directory:

- Build extension: `pnpm --filter @mindcontrol/code-vscode run build`
- Build webview: `pnpm --filter @mindcontrol/code-webview run build`
- Watch extension: `pnpm --filter @mindcontrol/code-vscode run watch`
- Watch webview: `pnpm --filter @mindcontrol/code-webview run watch`

Or use VS Code tasks:

- `Ctrl+Shift+P` → `Tasks: Run Task` → `build:extension` or `build:webview`
- `Ctrl+Shift+P` → `Tasks: Run Task` → `watch:extension` or `watch:webview`

## Development Plan

- [ ] MVP with playground for prompts defined in source code
- [ ] Prompts explorer that allows to find all prompts and quickly navigate
- [ ] Prompt evals to automatically test project prompts

# Claude Code Instructions

## React Component Code Style

Use the following pattern for React components:

```tsx
export namespace ComponentName {
  export interface Props {
    // Component props interface
  }
}

export function ComponentName(props: ComponentName.Props) {
  const {
    /* Destructure props here */
  } = props;

  return <div>...</div>;
}
```

**Simplification rules:**

- If component has no props, omit the Props interface and namespace
- If props are not destructured, omit the destructuring assignment
- Only include what is actually needed

```tsx
// Simple component with no props
export function SimpleComponent() {
  return <div>Simple content</div>;
}
```

This approach provides:

- Clear namespace organization when needed
- Type safety with props interface
- Consistent destructuring pattern
- Explicit function component definition
- Minimal boilerplate for simple cases

## Package Manager

- Use **pnpm** as the package manager for this project
- Always use `pnpm` commands instead of `npm` or `npx`
- Example: `pnpm run watch`, `pnpm install`, `pnpm run build`

## Code Formatting

- Use Prettier with default settings (configured in [`.prettierrc`](./.prettierrc))
- When executing multi-step plans, format code once after the entire plan is executed rather than on each individual step
- This improves efficiency and reduces unnecessary intermediate formatting operations
- Always run `pnpm run format` after completing a plan to ensure consistent code formatting across the entire codebase

## CLAUDE.md Style

### Markdown Code Style

- Use links for file references instead of plain text
- Example: [`package.json`](./package.json) instead of `package.json`
- This makes files clickable and easier to navigate in IDEs

### Task Lists

- Use checkbox syntax for tasks and future plans: `- [ ]` for incomplete, `- [x]` for completed
- This provides clear visual status and allows for easy tracking of progress

### Content Guidelines

- When adding new instructions, ensure they are not redundant with existing content
- Check that new guidelines do not contradict previous instructions
- Keep examples consistent with established patterns and naming conventions
- Remove or update conflicting information when making changes
